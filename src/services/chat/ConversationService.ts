import { IConversation, IMessage, IMessageNode } from 'interfaces/IConversation';
import { ConversationManager } from 'services/chat/ConversationManager';
import { OpenAIManager } from 'services/chat/OpenAIManager';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
	private currentConversation: IConversation | null = null;

	constructor(private openAIManager: OpenAIManager, private conversationManager: ConversationManager) { }

	/**
	 * Initializes a new conversation.
	 */
	public async initConversation(title: string = 'Untitled'): Promise<void> {
		await this.conversationManager.ensureWeaverFolderExists();
		this.currentConversation = await this.conversationManager.createConversation(title);
	}

	/**
	 * Loads an existing conversation by ID.
	 */
	public async loadConversation(conversationId: string): Promise<void> {
		const conversation = await this.conversationManager.getConversation(conversationId);

		if (!conversation) {
			throw new Error(`Conversation with ID ${conversationId} not found`);
		}

		this.currentConversation = conversation;
	}

	/**
	 * Sends a message and updates the conversation with the assistant's reply.
	 */
	public async sendMessage(userMessage: string): Promise<void> {
		if (!this.currentConversation) {
			throw new Error('No conversation initialized');
		}

		const userMessageNodeId = uuidv4();
		const now = Date.now() / 1000;

		const userMessageNode: IMessageNode = {
			id: userMessageNodeId,
			message: {
				id: userMessageNodeId,
				author: { role: 'user', name: null, metadata: {} },
				create_time: now,
				update_time: now,
				content: {
					content_type: 'text',
					parts: [userMessage],
				},
				status: 'finished_successfully',
				end_turn: true,
				weight: 1.0,
				metadata: {},
				recipient: 'all',
				channel: null,
			},
			parent: this.currentConversation.current_node,
			children: [],
		};

		await this.conversationManager.addMessageToConversation(
			this.currentConversation.id,
			userMessageNode
		);

		this.currentConversation.current_node = userMessageNode.id;

		const conversationPath = await this.conversationManager.getConversationPath(
			this.currentConversation.id
		);

		// Prepare messages for OpenAI API
		const messages: IMessage[] = conversationPath.filter((node) => node.message).map((node) => node.message!);

		// Send message to OpenAI API
		const response = await this.openAIManager.sendMessage(messages);

		// Get assistant's message
		const assistantMessageContent = response.choices[0].message?.content;

		// Create assistant message node
		const assistantMessageNodeId = uuidv4();

		const assistantMessageNode: IMessageNode = {
			id: assistantMessageNodeId,
			message: {
				id: assistantMessageNodeId,
				author: { role: 'assistant', name: null, metadata: {} },
				create_time: now,
				update_time: now,
				content: {
					content_type: 'text',
					parts: [assistantMessageContent || ''],
				},
				status: 'finished_successfully',
				end_turn: true,
				weight: 1.0,
				metadata: {},
				recipient: 'all',
				channel: null,
			},
			parent: userMessageNode.id,
			children: [],
		};

		await this.conversationManager.addMessageToConversation(
			this.currentConversation.id,
			assistantMessageNode
		);

		this.currentConversation.current_node = assistantMessageNodeId;
	}
}
