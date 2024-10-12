import { IConversation, IMessageNode } from 'interfaces/IConversation';
import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ConversationIOManager {
	private adapter: FileSystemAdapter;

	constructor(private plugin: Weaver) {
		this.adapter = plugin.app.vault.adapter as FileSystemAdapter;
	}

	/**
	 * Creates a new conversation with a given title.
	 */
	public async createConversation(title: string): Promise<IConversation> {
		const conversationId = uuidv4();
		const now = Date.now() / 1000;

		const conversation: IConversation = {
			title: title,
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

		// Initialize with a system message node
		const systemNodeId = uuidv4();
		const systemMessageNode: IMessageNode = {
			id: systemNodeId,
			message: null, // System messages may not have content initially
			parent: null,
			children: [],
		};

		conversation.mapping[systemNodeId] = systemMessageNode;
		conversation.current_node = systemNodeId;

		const conversationPath = path.join(this.plugin.settings.weaverFolder, 'conversations', `${conversationId}.json`);
		await this.adapter.write(conversationPath, JSON.stringify(conversation, null, 4));

		return conversation;
	}

	/**
	 * Adds a message node to a conversation.
	 */
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

	/**
	 * Updates an existing conversation.
	 */
	public async updateConversation(conversation: IConversation): Promise<boolean> {
		if (!conversation.id || !conversation.current_node || !conversation.mapping) {
			console.error('The updated conversation is missing required fields.');
			throw new Error('The updated conversation is missing required fields.');
		}

		const conversationPath = path.join(this.plugin.settings.weaverFolder, 'conversations', `${conversation.id}.json`);

		try {
			await this.adapter.write(conversationPath, JSON.stringify(conversation, null, 4));
			return true;
		} catch (error) {
			console.error(`Error writing to file ${conversationPath}:`, error);
			return false;
		}
	}

	//#region Accesors

	/**
	 * Retrieves a conversation by its ID.
	 */
	public async getConversation(conversationId: string): Promise<IConversation | null> {
		const conversationPath = path.join(this.plugin.settings.weaverFolder, 'conversations', `${conversationId}.json`);

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

	/**
	 * Retrieves the path of messages leading up to the current node.
	 */
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

	//#endregion
}
