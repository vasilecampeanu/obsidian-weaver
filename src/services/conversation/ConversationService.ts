import { IConversation, IMessage, IMessageNode } from 'interfaces/IConversation';
import Weaver from 'main';
import { OpenAIRequestManager } from 'services/api/providers/OpenAIRequestManager';
import { ConversationIOManager } from 'services/conversation/ConversationIOManager';
import { WeaverStoreSession } from 'services/store/slices/store.slicemaster';
import { v4 as uuidv4 } from 'uuid';
import { StoreApi } from 'zustand';

export class ConversationService {
	constructor(
		private openAIManager: OpenAIRequestManager,
		private conversationIOManager: ConversationIOManager,
		private store: StoreApi<WeaverStoreSession>,
		private plugin: Weaver
	) { }

	/**
	 * Initializes a new conversation.
	 * @param title - The title of the conversation to initialize. Defaults to 'Untitled'.
	 */
	public async initConversation(title: string = 'Untitled'): Promise<void> {
		if (this.plugin.settings.loadLastConversation) {
			const lastConversationId = await this.conversationIOManager.getLastConversationId();

			if (lastConversationId) {
				try {
					await this.loadConversation(lastConversationId);
					return;
				} catch (error) {
					console.error(`Failed to load conversation with ID ${lastConversationId}:`, error);
				}
			}
		}

		// Create a new conversation since loading the last one is not possible or not desired
		await this.createNewConversation(title);
	}

	/**
	 * Creates a new conversation with the given title.
	 * @param title - The title of the new conversation.
	 * @returns The newly created conversation.
	 */
	private async createNewConversation(title: string = 'Untitled'): Promise<IConversation> {
		const conversation = await this.conversationIOManager.createConversation(title);
		this.store.getState().setCurrentConversation(conversation);
		await this.conversationIOManager.updateLastConversationId(conversation.id);
		return conversation;
	}

	/**
	 * Sends a message and updates the conversation with the assistant's reply.
	 */
	public async generateAssistantMessage(userMessage: string): Promise<void> {
		const { currentConversation, setCurrentConversation } = this.store.getState();

		if (!currentConversation) {
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
			parent: currentConversation.current_node,
			children: [],
		};

		await this.conversationIOManager.addMessageToConversation(
			currentConversation.id,
			userMessageNode
		);

		currentConversation.current_node = userMessageNode.id;

		const conversationPath = await this.conversationIOManager.getConversationPath(
			currentConversation.id
		);

		// Prepare messages for OpenAI API
		const messages: IMessage[] = conversationPath
			.filter((node) => node.message)
			.map((node) => node.message!);

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

		await this.conversationIOManager.addMessageToConversation(
			currentConversation.id,
			assistantMessageNode
		);

		currentConversation.current_node = assistantMessageNodeId;

		// Update the current conversation in the store
		setCurrentConversation(currentConversation);
	}

	/**
	 * Loads an existing conversation by ID.
	 */
	public async loadConversation(conversationId: string): Promise<void> {
		const conversation = await this.conversationIOManager.getConversation(conversationId);

		if (!conversation) {
			throw new Error(`Conversation with ID ${conversationId} not found`);
		}

		this.store.getState().setCurrentConversation(conversation);

		// Update lastConversationId in store.json
		await this.conversationIOManager.updateLastConversationId(conversation.id);
	}
}
