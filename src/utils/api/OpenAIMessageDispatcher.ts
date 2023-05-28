import { IChatMessage, IConversation } from "interfaces/IThread";
import Weaver from "main";
import { OpenAIRequestManager } from "utils/api/OpenAIRequestManager";
import { v4 as uuidv4 } from 'uuid';
import OpenAIContentProvider from "./OpenAIContentProvider";

export class OpenAIMessageDispatcher {
	private readonly plugin: Weaver;
	private conversation?: IConversation;
	private setConversationSession: Function;
	private updateConversation: Function;
	private userMessage?: IChatMessage;
	private loadingAssistantMessage?: IChatMessage;
	private infoMessage?: IChatMessage;
	private openAIContentProvider: OpenAIContentProvider;

	constructor(plugin: Weaver, conversation: IConversation, setConversationSession: Function, updateConversation: Function) {
		this.plugin = plugin;
		this.conversation = conversation;
		this.updateConversation = updateConversation;
		this.setConversationSession = setConversationSession;
		this.userMessage = undefined;
		this.loadingAssistantMessage = undefined;
		this.infoMessage = undefined;
		this.openAIContentProvider = new OpenAIContentProvider(plugin)

		if (!this.conversation) {
			throw new Error('Conversation cannot be undefined.');
		}
	}

	private createUserMessage(inputText: string, shouldSetInfoMessageAsParent: boolean): IChatMessage {
		const currentNode = this.conversation?.currentNode;
		const currentMessage: IChatMessage | undefined = this.conversation?.messages.find((message) => message.id === currentNode);
		let userMessageParentId: string = currentMessage?.id ?? uuidv4();
		
		// If the condition is true, set the parent as the info message
		if (shouldSetInfoMessageAsParent) {
			userMessageParentId = this.infoMessage!.id;
		}
	
		const userMessage: IChatMessage = {
			children: [],
			context: false,
			content: inputText,
			creationDate: new Date().toISOString(),
			id: uuidv4(),
			mode: this.conversation!?.mode,
			model: this.conversation!?.model,
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
			isLoading: true,
			mode: this.conversation!?.mode,
			model: this.conversation!?.model,
			role: 'assistant',
			parent: userMessageId
		};

		return loadingAssistantMessage;
	}

	private createInfoMessage(parentId: string): IChatMessage {
		const infoMessage: IChatMessage = {
			children: [],
			context: false,
			content: 'Info...',
			creationDate: new Date().toISOString(),
			id: uuidv4(),
			mode: this.conversation!?.mode,
			model: this.conversation!?.model,
			role: 'info',
			parent: parentId
		};

		return infoMessage;
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

	public async handleSubmit(
		getRenderedMessages: Function,
		inputText: string,
		setIsLoading: Function
	) {
		setIsLoading(true)
		
		const shouldAddInfoMessage = this.conversation?.messages.length === 1;

		if (shouldAddInfoMessage) {
			const systemMessage = this.conversation!.messages[0];
			this.infoMessage = this.createInfoMessage(systemMessage.id);
			
			// Add info message to conversation
			await this.updateConversation(this.infoMessage, (contextMessages: IChatMessage[]) => {
				this.setConversationSession((conversation: IConversation) => {
					if (conversation) {
						return {
							...conversation,
							currentNode: this.infoMessage!.id,
							lastModified: new Date().toISOString(),
							messages: contextMessages
						};
					} else {
						return conversation;
					}
				});
			});
		}

		this.userMessage = this.createUserMessage(inputText, shouldAddInfoMessage);

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
			let currentNodeMessages: IChatMessage[] = rootMessage ? getRenderedMessages(this.conversation) : [];
			let filteredMessages: IChatMessage[] = currentNodeMessages.filter(message => {
				return message.role === 'assistant' || message.role === 'user' || message.role === 'system';
			});
			console.log(filteredMessages);
			contextMessages = [...(filteredMessages), this.userMessage];
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

		await this.openAIContentProvider.generateResponse(
			this.plugin.settings,
			{},
			this.conversation as IConversation,
			contextMessages,
			this.userMessage,
			this.addMessage.bind(this),
			this.updateCurrentAssistantMessageContent.bind(this)
		);

		setIsLoading(false)
	}

	public async handleStopStreaming() {
		await this.openAIContentProvider.stopStreaming();
	}

	public async handleRegenerateAssistantResponse(
		getRenderedMessages: Function,
		setIsLoading: Function
	) {
		setIsLoading(true)

		let currentNodeMessages: IChatMessage[] = getRenderedMessages(this.conversation);

		let filteredMessages: IChatMessage[] = currentNodeMessages.filter(message => {
			return message.role === 'assistant' || message.role === 'user' || message.role === 'system';
		});

		const reverseMessages = filteredMessages.reverse();
		const lastUserMessage = reverseMessages.find((message: { role: string; }) => message.role === 'user');

		filteredMessages.reverse();

		if (!lastUserMessage) {
			console.error('No user message found to regenerate.');
			return;
		}

		this.userMessage = lastUserMessage;

		if (this.conversation?.context === false) {
			filteredMessages = [this.userMessage];
		} else {
			filteredMessages.splice(filteredMessages.length - 1, 1);
		}

		this.loadingAssistantMessage = this.createAssistantLoadingMessage(this.userMessage!.id);

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
					currentNode: this.loadingAssistantMessage!.id,
					messages: [...(prevMessages ?? []), this.loadingAssistantMessage],
				};
			} else {
				return conversation;
			}
		});

		await this.openAIContentProvider.generateResponse(
			this.plugin.settings,
			{},
			this.conversation as IConversation,
			filteredMessages,
			this.userMessage as IChatMessage,
			this.addMessage.bind(this),
			this.updateCurrentAssistantMessageContent.bind(this)
		);

		setIsLoading(false)
	}
}
