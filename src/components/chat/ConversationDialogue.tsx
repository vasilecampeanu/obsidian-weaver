import React, { useState, useEffect, useCallback, useRef } from 'react';
import Weaver from 'main';

// Helpers
import { ConversationHelper } from 'helpers/ConversationHelpers';
import OpenAIContentProvider from 'helpers/OpenAIContentProvider';

// React Component
import { ChatHeader } from './Header';
import { MessageBubbleList } from './MessageBubbleList';
import { InputArea } from './InputArea';

export interface IChatMessage {
	role: string;
	timestamp: string;
	content: string;
	isLoading?: boolean;
}

export interface IChatSession {
	id: number;
	title: string;
	timestamp: string;
	messages: IChatMessage[];
}

export interface IConversationDialogue {
	plugin: Weaver,
	selectedConversationId: number | null,
	lastActiveConversationId: number | null,
	setLastActiveConversationId: (id: number) => void,
	onTabSwitch: (tabId: string) => void
}

export const ConversationDialogue: React.FC<IConversationDialogue> = ({
	plugin,
	selectedConversationId,
	lastActiveConversationId,
	setLastActiveConversationId,
	onTabSwitch
}) => {
	const [chatSession, setChatSession] = useState<IChatSession | undefined>(undefined)
	const [inputText, setInputText] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [welcomeMessage, setWelcomeMessage] = React.useState<string>(ConversationHelper.getRandomWelcomeMessage());

	// TODO: This needs to be stored somewhere else.
	const activeThreadId = 0;

	const openAIContentProviderRef = useRef(new OpenAIContentProvider(plugin));

	const loadChatSessionById = useCallback(async (chatSessionId: number) => {
		const data = await ConversationHelper.readConversations(plugin, activeThreadId);
		const selectedChatSession = data.find((c: IChatSession) => c.id === chatSessionId);

		if (selectedChatSession) {
			setChatSession(selectedChatSession);
		} else {
			console.error('Unable to find selected chat session.');
		}
	}, [activeThreadId]);

	const startNewChatSession = useCallback(async () => {
		const newChatSession: IChatSession = {
			id: Date.now(),
			title: `Untitled`,
			timestamp: new Date().toISOString(),
			messages: plugin.settings.showWelcomeMessage ? [{
					role: "system",
					timestamp: new Date().toISOString(),
					content: `${plugin.settings.systemRolePrompt}`
				}, {
					role: "assistant",
					timestamp: new Date().toISOString(),
					content: welcomeMessage
				}] : [{
					role: "system",
					timestamp: new Date().toISOString(),
					content: `${plugin.settings.systemRolePrompt}`
				}
			]
		};

		setChatSession(newChatSession);
		setLastActiveConversationId(newChatSession.id);

		try {
			const existingChatSessions = await ConversationHelper.readConversations(plugin, activeThreadId);
			const mergedChatSessions = [...existingChatSessions, newChatSession];

			const uniqueChatSessions = mergedChatSessions.filter((chatSession, index, array) => {
				return index === array.findIndex((c) => c.id === chatSession.id);
			});

			ConversationHelper.writeConversations(plugin, activeThreadId, uniqueChatSessions);
		} catch (error) {
			console.error('Error in chat session handling:', error);
		}
	}, [activeThreadId]);

	useEffect(() => {
		(async () => {
			try {
				if (chatSession === undefined) {
					if (selectedConversationId !== null) {
						loadChatSessionById(selectedConversationId);
					} else if (lastActiveConversationId !== null) {
						loadChatSessionById(lastActiveConversationId);
					} else {
						startNewChatSession();
					}
				}
			} catch (error) {
				console.error('Error in useEffect:', error);
			}
		})();
	}, [selectedConversationId, lastActiveConversationId, chatSession, loadChatSessionById, startNewChatSession]);

	const onBackToHomePage = () => {
		onTabSwitch("home-page");
	}

	const onUpdateConversationTitle = async (newTitle: string) => {
		if (chatSession) {
			const data = await ConversationHelper.readConversations(plugin, activeThreadId);
			const chatSessionIndex = data.findIndex((c: IChatSession) => c.id === chatSession.id);

			if (chatSessionIndex !== -1) {
				data[chatSessionIndex].title = newTitle;

				ConversationHelper.writeConversations(plugin, activeThreadId, data);

				setChatSession((prevState) => {
					if (prevState) {
						return {
							...prevState,
							title: newTitle
						};
					} else {
						return prevState;
					}
				});
			} else {
				console.error('Chat session not found.');
				return;
			}
		} else {
			console.error('Chat session is not initialized.');
			return;
		}
	};

	const onNewChat = () => {
		if (chatSession?.messages.length as number > 1) {
			setChatSession(undefined);
			startNewChatSession();
		}
	};

	const onSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (inputText.trim() === '') {
			return;
		}

		const timestamp: string = new Date().toISOString();
		const userMessage: IChatMessage = { role: 'user', content: inputText, timestamp };

		// Update the conversation with the user's message
		await updateConversation(userMessage, (updatedMessages) => {
			setInputText('');
			setChatSession((prevState) => {
				if (prevState) {
					return {
						...prevState,
						messages: updatedMessages
					};
				} else {
					return prevState;
				}
			});
		});

		// Create a new array of messages including the user's inputText
		const updatedMessages = [...(chatSession?.messages || []), userMessage];

		const loadingAssistantMessage: IChatMessage = {
			role: 'assistant',
			content: '',
			timestamp: '',
			isLoading: true
		};

		setIsLoading(true);

		setChatSession((prevConversation) => {
			if (prevConversation) {
				return {
					...prevConversation,
					messages: [...prevConversation.messages, loadingAssistantMessage],
				};
			} else {
				return prevConversation;
			}
		});

		// Generate the assistant's response message
		const assistantGeneratedResponse = await openAIContentProviderRef.current.generateResponse(plugin.settings, {}, updatedMessages);

		let assistantResponseContent = "";

		if (openAIContentProviderRef.current.isRequestCancelled()) {
			assistantResponseContent = "The response has been stopped as per your request. If you need assistance, feel free to ask again at any time.";
		} else if (!assistantGeneratedResponse) {
			assistantResponseContent = "I'm sorry, but I am unable to generate a response at this time. This may be because your request was cancelled, GPT4 is currently in use, or an error has occurred. Please check your settings and try again later.";
		} else {
			assistantResponseContent = assistantGeneratedResponse;
		}

		const assistantMessage = { role: 'assistant', content: assistantResponseContent, timestamp };

		// Update the conversation with the assistant's message
		await updateConversation(assistantMessage, (updatedMessages) => {
			setChatSession((prevState) => {
				if (prevState) {
					return {
						...prevState,
						messages: updatedMessages
					};
				} else {
					return prevState;
				}
			});
		});

		setIsLoading(false);
	};

	const onCancelRequest = useCallback(() => {
		openAIContentProviderRef.current.cancelRequest();
	}, []);

	const updateConversation = async (newMessage: IChatMessage, callback: (updatedMessages: IChatMessage[]) => void) => {
		if (chatSession) {
			const data = await ConversationHelper.readConversations(plugin, activeThreadId);
			const conversationIndex = data.findIndex((c: IChatSession) => c.id === chatSession.id);

			if (conversationIndex !== -1) {
				data[conversationIndex].messages.push(newMessage);
				ConversationHelper.writeConversations(plugin, activeThreadId, data);
				callback(data[conversationIndex].messages);
			} else {
				console.error('Conversation not found in the existing conversations array.');
			}
		} else {
			console.error('Chat session is not initialized.');
			return;
		}
	};

	return (
		<div className="chat-view">
			<ChatHeader title={chatSession?.title} onBackToHomePage={onBackToHomePage} onUpdateChatSessionTitle={onUpdateConversationTitle}></ChatHeader>
			<MessageBubbleList messages={chatSession?.messages} />
			<InputArea
				inputText={inputText}
				setInputText={setInputText}
				onSubmit={onSubmit}
				isLoading={isLoading}
				onCancelRequest={onCancelRequest}
				onNewChat={onNewChat}
			/>
		</div>
	)
}
