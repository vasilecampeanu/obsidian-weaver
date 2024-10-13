import { IConversation, IMessageNode } from 'interfaces/IConversation';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { readJsonFile, writeJsonFile } from '../../utils/FileIOUtils';

export class ConversationIOManager {
	private conversationsDir: string;

	constructor(private adapter: FileSystemAdapter, weaverDirectory: string) {
		this.conversationsDir = path.join(weaverDirectory, 'conversations');
	}

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

		await writeJsonFile(this.adapter, path.join(this.conversationsDir, conversationId), conversation);

		return conversation;
	}

	public async addMessageToConversation(
		conversationId: string,
		messageNode: IMessageNode
	): Promise<void> {
		const conversation = await readJsonFile<IConversation>(this.adapter, path.join(this.conversationsDir, conversationId));

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

		await writeJsonFile(this.adapter, path.join(this.conversationsDir, conversation.id), conversation);
	}

	public async updateConversation(conversation: IConversation): Promise<void> {
		if (!conversation.id || !conversation.current_node || !conversation.mapping) {
			throw new Error('The updated conversation is missing required fields.');
		}

		await writeJsonFile(this.adapter, path.join(this.conversationsDir, conversation.id), conversation);
	}

	public async getConversation(conversationId: string): Promise<IConversation | null> {
		return await readJsonFile<IConversation>(this.adapter, path.join(this.conversationsDir, conversationId));
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
