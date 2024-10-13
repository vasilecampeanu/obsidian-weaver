import { IConversation, IMessageNode } from 'interfaces/IConversation';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ConversationIOManager {
	private storePath: string;

	constructor(private adapter: FileSystemAdapter, weaverDirectory: string) { this.storePath = weaverDirectory; }

	public async createConversation(title: string): Promise<IConversation> {
		const conversationId = uuidv4();
		const now = Date.now() / 1000;

		const conversation: IConversation = {
			title,
			create_time: now,
			update_time: now,
			mapping: {},
			moderation_results: [],
			current_node: '',
			plugin_ids: null,
			conversation_id: conversationId,
			conversation_template_id: null,
			gizmo_id: null,
			is_archived: false,
			safe_urls: [],
			default_model_slug: 'gpt-4',
			conversation_origin: null,
			voice: null,
			async_status: null,
			id: conversationId,
		};

		const systemNodeId = uuidv4();
		const systemMessageNode: IMessageNode = {
			id: systemNodeId,
			message: null,
			parent: null,
			children: [],
		};

		conversation.mapping[systemNodeId] = systemMessageNode;
		conversation.current_node = systemNodeId;

		const conversationPath = path.join(
			this.storePath,
			'conversations',
			`${conversationId}.json`
		);
		await this.adapter.write(conversationPath, JSON.stringify(conversation, null, 4));

		return conversation;
	}

	public async addMessageToConversation(
		conversationId: string,
		messageNode: IMessageNode
	): Promise<void> {
		const conversation = await this.getConversation(conversationId);

		if (!conversation) {
			throw new Error('Conversation not found');
		}

		conversation.mapping[messageNode.id] = messageNode;

		if (messageNode.parent) {
			const parentNode = conversation.mapping[messageNode.parent];

			if (parentNode) {
				if (!parentNode.children.includes(messageNode.id)) {
					parentNode.children.push(messageNode.id);
				}
			} else {
				console.warn(`Parent node ${messageNode.parent} not found`);
			}
		}

		conversation.current_node = messageNode.id;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

	public async updateConversation(conversation: IConversation): Promise<void> {
		if (!conversation.id || !conversation.current_node || !conversation.mapping) {
			throw new Error('The updated conversation is missing required fields.');
		}

		const conversationPath = path.join(
			this.storePath,
			'conversations',
			`${conversation.id}.json`
		);

		try {
			await this.adapter.write(conversationPath, JSON.stringify(conversation, null, 4));
		} catch (error) {
			console.error(`Error writing to file ${conversationPath}:`, error);
			throw error;
		}
	}

	public async getConversation(conversationId: string): Promise<IConversation | null> {
		const conversationPath = path.join(
			this.storePath,
			'conversations',
			`${conversationId}.json`
		);

		try {
			const data = await this.adapter.read(conversationPath);
			return JSON.parse(data) as IConversation;
		} catch (error) {
			if (error.message.includes('ENOENT')) {
				return null;
			}
			throw error;
		}
	}

	public async getConversationPath(conversationId: string): Promise<IMessageNode[]> {
		const conversation = await this.getConversation(conversationId);

		if (!conversation) {
			throw new Error('Conversation not found');
		}

		const path: IMessageNode[] = [];
		let currentNode = conversation.mapping[conversation.current_node];

		while (currentNode) {
			path.unshift(currentNode);

			if (currentNode.parent) {
				currentNode = conversation.mapping[currentNode.parent];
			} else {
				break;
			}
		}

		return path;
	}

	/**
	 * Navigates to a specific node in the conversation.
	 */
	public async navigateToNode(conversationId: string, nodeId: string): Promise<void> {
		const conversation = await this.getConversation(conversationId);

		if (!conversation) {
			throw new Error('Conversation not found');
		}

		if (!conversation.mapping[nodeId]) {
			throw new Error('Node not found in conversation');
		}

		conversation.current_node = nodeId;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}
}
