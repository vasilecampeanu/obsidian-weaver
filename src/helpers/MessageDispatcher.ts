import { IChatMessage, IConversation } from "interfaces/IThread";
import Weaver from "main";
import { OpenAIRequestManager } from "utils/api/OpenAIRequestManager";
import { v4 as uuidv4 } from 'uuid';

export class MessageDispatcher {
	private conversation?: IConversation;
	private setConversationSession: Function;
	private updateConversation: Function;

	private userMessage?: IChatMessage;
    private loadingAssistantMessage?: IChatMessage;

	constructor(conversation: IConversation, setConversationSession: Function, updateConversation: Function) {
		this.conversation = conversation;
		this.updateConversation = updateConversation;
		this.setConversationSession = setConversationSession;
		this.userMessage = undefined;
		this.loadingAssistantMessage = undefined;
		
		if (!this.conversation) {
			throw new Error('Conversation cannot be undefined.');
		}
	}

	private createUserMessage(inputText: string): IChatMessage {
		const currentNode = this.conversation?.currentNode;
		const currentMessage: IChatMessage | undefined = this.conversation?.messages.find((message) => message.id === currentNode);
		const userMessageParentId: string = currentMessage?.id ?? uuidv4();

		const userMessage: IChatMessage = {
			children: [],
			context: false,
			content: inputText,
			creationDate: new Date().toISOString(),
			id: uuidv4(),
			role: 'user',
			parent: userMessageParentId
		};
		
		return userMessage;
	}

	private createAssistantLoadingMessage(userMessageId: string): IChatMessage {
		const loadingAssistantMessage: IChatMessage = {
			children: [],
			content: '',
			context: false,
			creationDate: '',
			id: uuidv4(),
			role: 'assistant',
			parent: userMessageId
		};

		return loadingAssistantMessage;
	}

	public async addMessage(message: IChatMessage) {
		await this.updateConversation(message, (contextMessages: IChatMessage[]) => {
			this.setConversationSession((conversation: IConversation) => {
				if (conversation) {
					return {
						...conversation,
						currentNode: message.id,
						lastModified: new Date().toISOString(),
						messages: contextMessages
					};
				} else {
					return conversation;
				}
			});
		});
	}

	public async updateCurrentAssistantMessageContent(newContent: string) {
		this.setConversationSession((conversation: IConversation) => {
			const userMessageIndex = conversation?.messages.findIndex((message) => {
				if (!message || !this.userMessage) {
					console.error('One or more objects are undefined:', { message, userMessage: this.userMessage });
					return false;
				}

				return message.id === this.userMessage.id;
			});

			const contextMessages = [...conversation!?.messages];

			this.loadingAssistantMessage!.content = newContent;
			contextMessages.splice(userMessageIndex as number, 1, this.userMessage as IChatMessage);

			if (conversation) {
				return {
					...conversation,
					messages: [...(contextMessages ?? []), this.loadingAssistantMessage],
				};
			} else {
				return conversation;
			}
		});
	}

	public async handleSubmit(plugin: Weaver, openAIContentProviderRef: any, getRenderedMessages: Function, inputText: string) {
		this.userMessage = this.createUserMessage(inputText);

		await this.updateConversation(this.userMessage, (contextMessages: IChatMessage[]) => {
			this.setConversationSession((conversation: IConversation) => {
				if (conversation) {
					return {
						...conversation,
						currentNode: this.userMessage?.id,
						lastModified: new Date().toISOString(),
						messages: contextMessages
					};
				} else {
					return conversation;
				}
			});
		});

		let contextMessages: IChatMessage[] = [];

		if (this.conversation?.context === true) {
			const rootMessage = this.conversation?.messages.find((msg) => msg.role === "system");
			let currentNodeMessages = rootMessage ? getRenderedMessages(this.conversation) : [];
			contextMessages = [...(currentNodeMessages), this.userMessage];
		} else {
			contextMessages = [this.userMessage];
		}

		this.loadingAssistantMessage = this.createAssistantLoadingMessage(this.userMessage.id);

		this.setConversationSession((conversation: IConversation) => {
			const userMessageIndex = conversation?.messages.findIndex((message) => {
				if (!message || !this.userMessage) {
					console.error('One or more objects are undefined:', { message, userMessage: this.userMessage });
					return false;
				}

				return message.id === this.userMessage.id;
			});


			const prevMessages = [...conversation!?.messages];
			const prevUserMessage = prevMessages[userMessageIndex as number];

			prevUserMessage.children.push(this.loadingAssistantMessage!.id);
			prevMessages.splice(userMessageIndex as number, 1, this.userMessage as IChatMessage);

			if (conversation) {
				return {
					...conversation,
					messages: [...(prevMessages ?? []), this.loadingAssistantMessage],
				};
			} else {
				return conversation;
			}
		});

		const requestManager = new OpenAIRequestManager();

		await openAIContentProviderRef.current.generateResponse(
			plugin.settings,
			requestManager,
			{},
			contextMessages,
			this.userMessage,
			this.addMessage.bind(this),
			this.updateCurrentAssistantMessageContent.bind(this)
		);
	}
}
