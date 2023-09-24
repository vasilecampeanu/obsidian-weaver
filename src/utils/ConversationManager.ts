import { Conversation, ConversationNode, Message } from 'interfaces/Conversation';
import Weaver from 'main';
import { v4 as uuidv4 } from 'uuid';
import { WeaverFileManager } from './WeaverFileManager';

export class ConversationManager {
	private plugin: Weaver;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
	}

	generateNewConversation(title: string): Conversation {
		const currentNodeId = uuidv4();
		const currentMessageId = uuidv4();
		const conversationId = uuidv4();

		const message: Message = {
			id: currentMessageId,
			author: {
				role: 'system',
				name: null,
				metadata: null
			},
			create_time: Date.now(),
			update_time: Date.now(),
			content: {
				content_type: 'text',
				parts: ['']
			},
			status: 'finished_successfully',
			end_turn: null,
			weight: 1,
			metadata: {},
			recipient: 'all'
		};

		const node: ConversationNode = {
			id: currentNodeId,
			message: message,
			parent: null,
			children: []
		};

		return {
			title: title,
			create_time: Date.now(),
			update_time: Date.now(),
			mapping: {
				[currentNodeId]: node
			},
			moderation_results: [],
			current_node: currentNodeId,
			plugin_ids: null,
			conversation_id: conversationId,
			conversation_template_id: null,
			id: conversationId
		};
	}

	getUniqueTitle(baseTitle: string, conversations: Conversation[]): string {
		let index = 0;
		let proposedTitle = baseTitle;

		const existingTitles = conversations.map(conversation => conversation.title);

		while (existingTitles.includes(proposedTitle)) {
			index += 1;
			proposedTitle = `${baseTitle} ${index}`;
		}

		return proposedTitle;
	}

	async createConversation(): Promise<Conversation> {
		const folderPath = `${this.plugin.settings.weaverFolderPath}/threads/default`;
		const filesInFolder = await WeaverFileManager.listFilesInFolder(this.plugin, folderPath);

		const conversations: Conversation[] = await Promise.all(filesInFolder.map(async filePath => {
			const fileContent = await WeaverFileManager.readFile(this.plugin, filePath);
			return JSON.parse(fileContent) as Conversation;
		}));

		const uniqueTitle = this.getUniqueTitle("Untitled", conversations);

		let title = uniqueTitle;
		let index = 1;

		while (filesInFolder.includes(`${folderPath}/${title}.json`)) {
			title = `${uniqueTitle} ${index}`;
			index += 1;
		}

		const newConversation = this.generateNewConversation(title);

		await WeaverFileManager.ensureWeaverFolderPathExists(this.plugin);
		await WeaverFileManager.ensureFolderPathExists(this.plugin, "threads/default");

		const newFilePath = `${folderPath}/${title}.json`;
		await WeaverFileManager.writeFile(this.plugin, newFilePath, JSON.stringify(newConversation, null, 4));

		return newConversation;
	}

	async addNewMessageToConversation(conversationId: string, content: string): Promise<Conversation> {
		const conversation = await this.getConversationById(conversationId);
		const newNodeId = uuidv4();

		if (!conversation) {
			throw new Error(`Conversation with ID ${conversationId} not found.`);
		}
	
		const newMessage: Message = {
			id: newNodeId,
			author: {
				role: 'user',
				name: null,
				metadata: null
			},
			create_time: Date.now(),
			update_time: Date.now(),
			content: {
				content_type: 'text',
				parts: [content]
			},
			status: 'finished_successfully',
			end_turn: null,
			weight: 1,
			metadata: {
				timestamp_: 'absolute',
			},
			recipient: 'all'
		};

		const newNode: ConversationNode = {
			id: newNodeId,
			message: newMessage,
			parent: conversation.current_node,
			children: []
		};

		conversation.mapping[newNodeId] = newNode;

		if (conversation.current_node && conversation.mapping[conversation.current_node]) {
			conversation.mapping[conversation.current_node].children.push(newNodeId);
		}

		conversation.current_node = newNodeId;
		conversation.update_time = Date.now();

		const folderPath = `${this.plugin.settings.weaverFolderPath}/threads/default`;
		const filePath = `${folderPath}/${conversation.title}.json`;

		await WeaverFileManager.writeFile(this.plugin, filePath, JSON.stringify(conversation, null, 4));

		return conversation;
	}

	async getAllConversations(): Promise<Conversation[]> {
		const folderPath = `${this.plugin.settings.weaverFolderPath}/threads/default`;
		const filesInFolder = await WeaverFileManager.listFilesInFolder(this.plugin, folderPath);

		const conversations: Conversation[] = await Promise.all(filesInFolder.map(async filePath => {
			const fileContent = await WeaverFileManager.readFile(this.plugin, filePath);
			return JSON.parse(fileContent) as Conversation;
		}));

		return conversations;
	}

	async getConversationById(conversationId: string): Promise<Conversation | null> {
		const folderPath = `${this.plugin.settings.weaverFolderPath}/threads/default`;
		const filesInFolder = await WeaverFileManager.listFilesInFolder(this.plugin, folderPath);

		for (const filePath of filesInFolder) {
			const fileContent = await WeaverFileManager.readFile(this.plugin, filePath);
			const conversation = JSON.parse(fileContent) as Conversation;

			if (conversation.id === conversationId) {
				return conversation;
			}
		}

		return null;
	}

	async updateCurrentNodeOfConversation(conversationId: string, newNodeId: string): Promise<Conversation | null> {
		const conversation = await this.getConversationById(conversationId);
	
		if (!conversation) {
			throw new Error(`Conversation with ID ${conversationId} not found.`);
		}
	
		if (!conversation.mapping[newNodeId]) {
			throw new Error(`Node with ID ${newNodeId} not found in the conversation.`);
		}
	
		conversation.current_node = newNodeId;
		conversation.update_time = Date.now();
	
		const folderPath = `${this.plugin.settings.weaverFolderPath}/threads/default`;
		const filePath = `${folderPath}/${conversation.title}.json`;
	
		await WeaverFileManager.writeFile(this.plugin, filePath, JSON.stringify(conversation, null, 4));
	
		return conversation;
	}
}
