import { IConversation, IMessage, IMessageNode } from 'interfaces/IChatDialogueFeed';
import { App, TFile, TFolder } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';

export class ConversationManager {
	private static WEAVER_FOLDER = '.weaver';
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	private async ensureWeaverFolder(): Promise<TFolder> {
		let weaverFolder = this.app.vault.getAbstractFileByPath(ConversationManager.WEAVER_FOLDER);
		if (!weaverFolder) {
			await this.app.vault.createFolder(ConversationManager.WEAVER_FOLDER);
			weaverFolder = this.app.vault.getAbstractFileByPath(ConversationManager.WEAVER_FOLDER);
		}
		return weaverFolder as TFolder;
	}

	public async createConversation(title: string): Promise<IConversation> {
		await this.ensureWeaverFolder();

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

		// Initialize the conversation with a root system message node
		const systemNodeId = uuidv4();
		const systemMessageNode: IMessageNode = {
			id: systemNodeId,
			message: null,
			parent: null,
			children: [],
		};
		conversation.mapping[systemNodeId] = systemMessageNode;
		conversation.current_node = systemNodeId;

		const conversationPath = `${ConversationManager.WEAVER_FOLDER}/${conversationId}.json`;
		await this.app.vault.create(conversationPath, JSON.stringify(conversation, null, 4));

		return conversation;
	}

	public async getConversation(conversationId: string): Promise<IConversation | null> {
		const conversationPath = `${ConversationManager.WEAVER_FOLDER}/${conversationId}.json`;
		const conversationFile = this.app.vault.getAbstractFileByPath(conversationPath) as TFile;

		if (!conversationFile) {
			return null;
		}

		const data = await this.app.vault.read(conversationFile);
		return JSON.parse(data) as IConversation;
	}

	public async updateConversation(conversation: IConversation): Promise<void> {
		const conversationPath = `${ConversationManager.WEAVER_FOLDER}/${conversation.id}.json`;
		const conversationFile = this.app.vault.getAbstractFileByPath(conversationPath) as TFile;

		if (!conversationFile) {
			throw new Error('Conversation file not found');
		}

		await this.app.vault.modify(conversationFile, JSON.stringify(conversation, null, 4));
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

		// Update parent node's children
		if (messageNode.parent) {
			const parentNode = conversation.mapping[messageNode.parent];
			if (parentNode) {
				// Avoid duplicate entries
				if (!parentNode.children.includes(messageNode.id)) {
					parentNode.children.push(messageNode.id);
				}
			}
		}

		// Update conversation's current node
		conversation.current_node = messageNode.id;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

	// Method to edit a message and create a branch
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

		// Create a new node with the edited message
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
				// Add or override any metadata if necessary
			},
			recipient: originalNode.message.recipient || 'all',
			channel: originalNode.message.channel || null
		};

		const editedNode: IMessageNode = {
			id: editedNodeId,
			message: editedMessage,
			parent: originalNode.parent,
			children: []
		};

		// Add the new edited node to the conversation mapping
		conversation.mapping[editedNodeId] = editedNode;

		// Update the parent's children to include the new branch
		if (editedNode.parent) {
			const parentNode = conversation.mapping[editedNode.parent];
			if (parentNode) {
				// Avoid duplicate entries
				if (!parentNode.children.includes(editedNodeId)) {
					parentNode.children.push(editedNodeId);
				}
			}
		}

		// Update the conversation's current node to the edited node
		conversation.current_node = editedNodeId;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

	// Method to regenerate a message and create a branch
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

		// Implement logic to regenerate the message using OpenAI API
		// For demonstration, we'll assume a placeholder regenerated message
		const regeneratedContent = '[Regenerated content]';

		const regeneratedNodeId = uuidv4();

		// Create a new IMessage object with all required fields
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
				// Add or override any metadata if necessary
			},
			recipient: originalNode.message.recipient || 'all',
			channel: originalNode.message.channel || null
		};

		const regeneratedNode: IMessageNode = {
			id: regeneratedNodeId,
			message: regeneratedMessage,
			parent: originalNode.parent, // Keep the same parent
			children: [], // Start fresh for the regenerated branch
		};

		// Add the regenerated node to the conversation mapping
		conversation.mapping[regeneratedNodeId] = regeneratedNode;

		// Update the parent's children to include the new branch
		if (regeneratedNode.parent) {
			const parentNode = conversation.mapping[regeneratedNode.parent];
			if (parentNode) {
				// Avoid duplicate entries
				if (!parentNode.children.includes(regeneratedNodeId)) {
					parentNode.children.push(regeneratedNodeId);
				}
			}
		}

		// Update the conversation's current node to the regenerated node
		conversation.current_node = regeneratedNodeId;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

	// Method to navigate to a specific node in the conversation
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

	// Helper method to get the conversation path from the root to the current node
	public async getConversationPath(conversationId: string): Promise<IMessageNode[]> {
		const conversation = await this.getConversation(conversationId);
		if (!conversation) {
			throw new Error('Conversation not found');
		}

		let path: IMessageNode[] = [];
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
