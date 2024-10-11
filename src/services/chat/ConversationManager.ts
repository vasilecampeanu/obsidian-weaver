import { IConversation, IMessage, IMessageNode } from 'interfaces/IConversation';
import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class ConversationManager {
	private adapter: FileSystemAdapter;

	constructor(private plugin: Weaver) {
		this.adapter = plugin.app.vault.adapter as FileSystemAdapter;
	}

	/**
	 * Ensures that the Weaver folder and the conversations folder inside it exist in the vault.
	 */
	public async ensureWeaverFolderExists(): Promise<void> {
		const folderPath = this.plugin.settings.weaverFolder;
		const weaverExists = await this.adapter.exists(folderPath);

		if (!weaverExists) {
			await this.adapter.mkdir(folderPath);
		}

		// Ensure the conversations folder exists inside the Weaver folder
		const conversationsFolderPath = `${folderPath}/conversations`;
		const conversationsExists = await this.adapter.exists(conversationsFolderPath);

		if (!conversationsExists) {
			await this.adapter.mkdir(conversationsFolderPath);
		}
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
	 * Edits an existing message in a conversation.
	 */
	public async editMessage(
		conversationId: string,
		messageNodeId: string,
		newContent: string
	): Promise<void> {
		const conversation = await this.getConversation(conversationId);

		if (!conversation) {
			throw new Error('Conversation not found');
		}

		const originalNode = conversation.mapping[messageNodeId];

		if (!originalNode || !originalNode.message) {
			throw new Error('Message node not found or has no message');
		}

		const editedNodeId = uuidv4();
		const editedMessage: IMessage = {
			id: editedNodeId,
			author: originalNode.message.author,
			create_time: originalNode.message.create_time || Date.now() / 1000,
			update_time: Date.now() / 1000,
			content: {
				content_type: originalNode.message.content.content_type,
				parts: [newContent],
			},
			status: originalNode.message.status || 'finished_successfully',
			end_turn: originalNode.message.end_turn,
			weight: originalNode.message.weight || 1.0,
			metadata: {
				...originalNode.message.metadata,
			},
			recipient: originalNode.message.recipient || 'all',
			channel: originalNode.message.channel || null,
		};

		const editedNode: IMessageNode = {
			id: editedNodeId,
			message: editedMessage,
			parent: originalNode.parent,
			children: [],
		};

		conversation.mapping[editedNodeId] = editedNode;

		if (editedNode.parent) {
			const parentNode = conversation.mapping[editedNode.parent];
			if (parentNode) {
				if (!parentNode.children.includes(editedNodeId)) {
					parentNode.children.push(editedNodeId);
				}
			} else {
				console.warn(`Parent node ${editedNode.parent} not found`);
			}
		}

		conversation.current_node = editedNodeId;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

	/**
	 * Regenerates a message using OpenAI API (placeholder implementation).
	 */
	public async regenerateMessage(
		conversationId: string,
		messageNodeId: string
	): Promise<void> {
		const conversation = await this.getConversation(conversationId);

		if (!conversation) {
			throw new Error('Conversation not found');
		}

		const originalNode = conversation.mapping[messageNodeId];

		if (!originalNode || !originalNode.message) {
			throw new Error('Message node not found or has no message');
		}

		// TODO: Implement logic to regenerate the message using OpenAI API
		const regeneratedContent = '[Regenerated content]';

		const regeneratedNodeId = uuidv4();

		const regeneratedMessage: IMessage = {
			id: regeneratedNodeId,
			author: originalNode.message.author,
			create_time: Date.now() / 1000,
			update_time: Date.now() / 1000,
			content: {
				content_type: originalNode.message.content.content_type,
				parts: [regeneratedContent],
			},
			status: originalNode.message.status || 'finished_successfully',
			end_turn: originalNode.message.end_turn,
			weight: originalNode.message.weight || 1.0,
			metadata: {
				...originalNode.message.metadata,
			},
			recipient: originalNode.message.recipient || 'all',
			channel: originalNode.message.channel || null,
		};

		const regeneratedNode: IMessageNode = {
			id: regeneratedNodeId,
			message: regeneratedMessage,
			parent: originalNode.parent,
			children: [],
		};

		conversation.mapping[regeneratedNodeId] = regeneratedNode;

		if (regeneratedNode.parent) {
			const parentNode = conversation.mapping[regeneratedNode.parent];

			if (parentNode) {
				if (!parentNode.children.includes(regeneratedNodeId)) {
					parentNode.children.push(regeneratedNodeId);
				}
			} else {
				console.warn(`Parent node ${regeneratedNode.parent} not found`);
			}
		}

		conversation.current_node = regeneratedNodeId;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
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
}
