import { IConversation, IMessage, IMessageNode } from 'interfaces/IChatDialogueFeed';
import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';

export class ConversationManager {
	private adapter: FileSystemAdapter;

	constructor(private plugin: Weaver) {
		this.adapter = plugin.app.vault.adapter as FileSystemAdapter;
	}

	public async ensureWeaverFolderExists(): Promise<void> {
		// TODO: 
	}

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

		const systemNodeId = uuidv4();
		const systemMessageNode: IMessageNode = {
			id: systemNodeId,
			message: null,
			parent: null,
			children: [],
		};

		conversation.mapping[systemNodeId] = systemMessageNode;
		conversation.current_node = systemNodeId;

		const conversationPath = `${this.plugin.settings.weaverFolder}/${conversationId}.json`;
		await this.adapter.write(conversationPath, JSON.stringify(conversation, null, 4));

		return conversation;
	}

	public async getConversation(conversationId: string): Promise<IConversation | null> {
		const conversationPath = `${this.plugin.settings.weaverFolder}/${conversationId}.json`;
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

	public async updateConversation(conversation: IConversation): Promise<boolean> {
		const folderPath = this.plugin.settings.weaverFolder;
		const files = await this.adapter.list(folderPath);
		const jsonFiles = files.files.filter(filePath => filePath.endsWith('.json'));

		for (const filePath of jsonFiles) {
			try {
				const fileContent = await this.adapter.read(filePath);
				const existingConversation = JSON.parse(fileContent) as IConversation;

				if (existingConversation.id === conversation.id) {
					if (!conversation.id || !conversation.current_node || !conversation.mapping) {
						console.error('The updated conversation is missing required fields.');
						throw new Error('The updated conversation is missing required fields.');
					}

					await this.adapter.write(filePath, JSON.stringify(conversation, null, 4));

					return true;
				}
			} catch (error) {
				console.error(`Error reading or parsing file ${filePath}:`, error);
				continue;
			}
		}

		console.error(`Conversation with ID: ${conversation.id} not found`);

		return false;
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
			}
		}

		conversation.current_node = messageNode.id;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

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
			channel: originalNode.message.channel || null
		};

		const editedNode: IMessageNode = {
			id: editedNodeId,
			message: editedMessage,
			parent: originalNode.parent,
			children: []
		};

		conversation.mapping[editedNodeId] = editedNode;

		if (editedNode.parent) {
			const parentNode = conversation.mapping[editedNode.parent];
			if (parentNode) {
				if (!parentNode.children.includes(editedNodeId)) {
					parentNode.children.push(editedNodeId);
				}
			}
		}

		conversation.current_node = editedNodeId;
		conversation.update_time = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

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
			channel: originalNode.message.channel || null
		};

		const regeneratedNode: IMessageNode = {
			id: regeneratedNodeId,
			message: regeneratedMessage,
			parent: originalNode.parent,
			children: []
		};

		conversation.mapping[regeneratedNodeId] = regeneratedNode;

		if (regeneratedNode.parent) {
			const parentNode = conversation.mapping[regeneratedNode.parent];

			if (parentNode) {
				if (!parentNode.children.includes(regeneratedNodeId)) {
					parentNode.children.push(regeneratedNodeId);
				}
			}
		}

		conversation.current_node = regeneratedNodeId;
		conversation.update_time  = Date.now() / 1000;

		await this.updateConversation(conversation);
	}

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
