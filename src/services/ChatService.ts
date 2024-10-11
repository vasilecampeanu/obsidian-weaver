import { ConversationManager } from "apis/ConversationManager";
import { OpenAIManager } from "apis/OpenAIManager";
import { IConversation, IMessage, IMessageNode } from "interfaces/IChatDialogueFeed";
import { v4 as uuidv4 } from "uuid";

export class ChatService {
	private currentConversation: IConversation | null = null;

	constructor(
		private openAIManager: OpenAIManager,
		private conversationManager: ConversationManager
	) {
		// Initialize the current conversation
		this.initConversation();
	}

	private async initConversation(): Promise<void> {
		// Ensure Weaver folder exists
		await this.conversationManager.ensureWeaverFolderExists();

		// Create a new conversation
		this.currentConversation = await this.conversationManager.createConversation(
			"Untitled"
		);
	}

	public async sendMessage(userMessage: string): Promise<void> {
		if (!this.currentConversation) {
			throw new Error("No conversation initialized");
		}

		// Create user message node
		const userMessageNodeId = uuidv4();
		const now = Date.now() / 1000;

		const userMessageNode: IMessageNode = {
			id: userMessageNodeId,
			message: {
				id: userMessageNodeId,
				author: { role: "user", name: null, metadata: {} },
				create_time: now,
				update_time: now,
				content: {
					content_type: "text",
					parts: [userMessage],
				},
				status: "finished_successfully",
				end_turn: true,
				weight: 1.0,
				metadata: {},
				recipient: "all",
				channel: null,
			},
			parent: this.currentConversation.current_node,
			children: [],
		};

		// Add user message to conversation
		await this.conversationManager.addMessageToConversation(
			this.currentConversation.id,
			userMessageNode
		);

		// Update current node
		this.currentConversation.current_node = userMessageNode.id;

		// Get conversation path
		const conversationPath = await this.conversationManager.getConversationPath(
			this.currentConversation.id
		);

		// Prepare messages for OpenAI API as IMessage[]
		const messages: IMessage[] = conversationPath
			.filter((node) => node.message)
			.map((node) => node.message!);

		// Send message to OpenAI API
		const response = await this.openAIManager.sendMessage(messages);

		// Get assistant's message
		const assistantMessageContent = response.choices[0].message.content;

		// Create assistant message node
		const assistantMessageNodeId = uuidv4();

		const assistantMessageNode: IMessageNode = {
			id: assistantMessageNodeId,
			message: {
				id: assistantMessageNodeId,
				author: { role: "assistant", name: null, metadata: {} },
				create_time: now,
				update_time: now,
				content: {
					content_type: "text",
					parts: [assistantMessageContent || ""],
				},
				status: "finished_successfully",
				end_turn: true,
				weight: 1.0,
				metadata: {},
				recipient: "all",
				channel: null,
			},
			parent: userMessageNode.id,
			children: [],
		};

		// Add assistant message to conversation
		await this.conversationManager.addMessageToConversation(
			this.currentConversation.id,
			assistantMessageNode
		);

		// Update current node
		this.currentConversation.current_node = assistantMessageNodeId;
	}
}
