import { IConversation, IMessage, IMessageNode } from 'interfaces/IConversation';
import { OpenAIRequestManager } from 'services/api/providers/OpenAIRequestManager';
import { ConversationIOManager } from 'services/conversation/ConversationIOManager';
import { WeaverStore } from 'services/store/Store';
import { v4 as uuidv4 } from 'uuid';

export class ConversationService {
	constructor(
		private openAIManager: OpenAIRequestManager,
		private conversationIOManager: ConversationIOManager,
		private store: WeaverStore
	) {}

	public async initConversation(
		loadLastConversation: boolean,
		title: string = 'Untitled'
	): Promise<void> {
		if (loadLastConversation) {
			const previousConversationId = this.store.getState().previousConversationId;

			if (previousConversationId) {
				try {
					await this.loadConversation(previousConversationId);
					return;
				} catch (error) {
					console.error(
						`Failed to load conversation with ID ${previousConversationId}:`,
						error
					);
				}
			}
		}

		await this.createNewConversation(title);
	}

	private async createNewConversation(
		title: string = 'Untitled'
	): Promise<IConversation> {
		const conversation = await this.conversationIOManager.createConversation(title);
		this.store.getState().setCurrentConversation(conversation);
		this.store.getState().setPreviousConversationId(conversation.id);
		return conversation;
	}

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

		const messages: IMessage[] = conversationPath
			.filter((node) => node.message)
			.map((node) => node.message!);

		let response;

		try {
			response = await this.openAIManager.sendMessage(messages);
		} catch (error) {
			console.error('Error sending message to OpenAI:', error);
			return;
		}

		const assistantMessageContent = response.choices[0].message?.content || '';

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
					parts: [assistantMessageContent],
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

		setCurrentConversation(currentConversation);
	}

	public async loadConversation(conversationId: string): Promise<void> {
		const conversation = await this.conversationIOManager.getConversation(conversationId);

		if (!conversation) {
			throw new Error(`Conversation with ID ${conversationId} not found`);
		}

		this.store.getState().setCurrentConversation(conversation);
		this.store.getState().setPreviousConversationId(conversation.id);
	}
}
