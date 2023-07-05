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
	private assistantMessage?: IChatMessage;
	private infoMessage?: IChatMessage;
	private selectedTextMessage?: IChatMessage;
	private openAIContentProvider: OpenAIContentProvider;

	constructor(plugin: Weaver, conversation: IConversation, setConversationSession: Function, updateConversation: Function) {
		this.plugin = plugin;
		this.conversation = conversation;
		this.updateConversation = updateConversation;
		this.setConversationSession = setConversationSession;
		this.userMessage = undefined;
		this.loadingAssistantMessage = undefined;
		this.assistantMessage = undefined;
		this.infoMessage = undefined;
		this.selectedTextMessage = undefined;
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
			id: uuidv4(),
			parent: userMessageParentId,
			children: [],
			message_type: 'chat',
			status: 'finished_successfully',
			context: false,
			create_time: new Date().toISOString(),
			update_time: new Date().toISOString(),
			author: {
				role: 'user',
				ai_model: this.conversation!?.model,
				mode: this.conversation!?.mode,
			},
			content: {
				content_type: 'text',
				parts: inputText
			},
		};

		return userMessage;
	}

	private createAssistantLoadingMessage(userMessageId: string): IChatMessage {
		const loadingAssistantMessage: IChatMessage = {
			id: uuidv4(),
			parent: userMessageId,
			children: [],
			message_type: 'chat',
			status: 'loading',
			context: false,
			is_loading: true,
			create_time: new Date().toISOString(),
			update_time: new Date().toISOString(),
			author: {
				role: 'assistant',
				ai_model: this.conversation!?.model,
				mode: this.conversation!?.mode,
			},
			content: {
				content_type: 'text',
				parts: ''
			},
		};

		return loadingAssistantMessage;
	}

	private createAssistantMessage(
		userMessageId: string, 
		contentMessage: string,
		contentType: string
	): IChatMessage {
		const assistantMessage: IChatMessage = {
			id: uuidv4(),
			parent: userMessageId,
			children: [],
			message_type: 'chat',
			status: 'finished_successfully',
			context: false,
			create_time: new Date().toISOString(),
			update_time: new Date().toISOString(),
			author: {
				role: 'assistant',
				ai_model: this.conversation!?.model,
				mode: this.conversation!?.mode,
			},
			content: {
				content_type: contentType,
				parts: contentMessage
			},
		};

		return assistantMessage;
	}

	private createInfoMessage(parentId: string): IChatMessage {
		const infoMessage: IChatMessage = {
			id: uuidv4(),
			parent: parentId,
			children: [],
			message_type: 'info',
			status: 'finished_successfully',
			context: false,
			// is_loading: false,
			create_time: new Date().toISOString(),
			update_time: new Date().toISOString(),
			author: {
				role: 'helper',
				ai_model: this.conversation!?.model,
				mode: this.conversation!?.mode,
			},
			content: {
				content_type: 'text',
				parts: ''
			},
		};

		return infoMessage;
	}

	private createSelectedTextMessage(parentId: string, selectedText: string): IChatMessage {
		const selectedTextMessage: IChatMessage = {
			id: uuidv4(),
			parent: parentId,
			children: [],
			message_type: 'chat',
			status: 'finished_successfully',
			context: false,
			create_time: new Date().toISOString(),
			update_time: new Date().toISOString(),
			author: {
				role: 'assistant',
				ai_model: this.conversation!?.model,
				mode: this.conversation!?.mode,
			},
			content: {
				content_type: 'selected_text',
				parts: selectedText
			},
		};

		return selectedTextMessage;
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

			if (!this.loadingAssistantMessage || !this.loadingAssistantMessage.id) {
				throw new Error('loadingAssistantMessage is not properly defined');
			}

			this.loadingAssistantMessage.content.parts = newContent;

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
			const rootMessage = this.conversation?.messages.find((msg) => msg.author.role === "system");

			let currentNodeMessages: IChatMessage[] = rootMessage ? getRenderedMessages(this.conversation) : [];

			let filteredMessages: IChatMessage[] = currentNodeMessages.filter(message => {
				return message.author.role === 'assistant' || message.author.role === 'user' || message.author.role === 'system';
			});

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
			return message.author.role === 'assistant' || message.author.role === 'user' || message.author.role === 'system';
		});

		const reverseMessages = filteredMessages.reverse();
		const lastUserMessage = reverseMessages.find((message) => message.author.role === 'user');

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

	public async submitSelectedTextToChat(
		getRenderedMessages: Function,
		selectedText: string
	) {
		let currentNodeMessages: IChatMessage[] = getRenderedMessages(this.conversation);

		let filteredMessages: IChatMessage[] = currentNodeMessages.filter(message => {
			return message.author.role === 'assistant' || message.author.role === 'user' || message.author.role === 'system';
		});

		// Create a copy of the filteredMessages array
		const copiedMessages = [...filteredMessages];

		// Get the last message from the copiedMessages array
		const lastMessage: IChatMessage | undefined = copiedMessages.pop();

		// Create Selected Text Message
		this.selectedTextMessage = this.createSelectedTextMessage(lastMessage!?.id, selectedText);

		console.log(selectedText);

		// Add info message to conversation
		await this.updateConversation(this.selectedTextMessage, (contextMessages: IChatMessage[]) => {
			this.setConversationSession((conversation: IConversation) => {
				if (conversation) {
					return {
						...conversation,
						currentNode: this.selectedTextMessage!.id,
						lastModified: new Date().toISOString(),
						messages: contextMessages
					};
				} else {
					return conversation;
				}
			});
		});

		this.assistantMessage = this.createAssistantMessage(
			this.selectedTextMessage!?.id, 
			'What do you want to do with the text?',
			'question'
		);

		// Add info message to conversation
		await this.updateConversation(this.assistantMessage, (contextMessages: IChatMessage[]) => {
			this.setConversationSession((conversation: IConversation) => {
				if (conversation) {
					return {
						...conversation,
						currentNode: this.assistantMessage!.id,
						lastModified: new Date().toISOString(),
						messages: contextMessages
					};
				} else {
					return conversation;
				}
			});
		});
	}
}
