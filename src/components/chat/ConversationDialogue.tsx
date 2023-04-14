import React, { useState, useEffect, useCallback, useRef } from 'react';
import Weaver from 'main';

// Helpers
import { ConversationHelper } from 'helpers/ConversationHelpers';
import OpenAIContentProvider from 'helpers/OpenAIContentProvider';

// React Component
import { ChatHeader } from './ChatHeader';
import { DialogueTimeline } from './DialogueTimeline';
import { InputArea } from './InputArea';

export interface IChatMessage {
	content: string;
	creationDate: string;
	isLoading?: boolean;
	role: string;
}

export interface IChatSession {
	color: string;
	context: true;
	creationDate: string;
	icon: string;
	id: number;
	lastModified: string;
	messages: IChatMessage[];
	messagesCount: number;
	model: string;
	path: string;
	tags: string[];
	title: string;
	tokens: number;
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
	const [conversationTitle, setConversationTitle] = useState(chatSession?.title);

	// TODO: This needs to be stored somewhere else.
	const activeThreadId = 0;

	const openAIContentProviderRef = useRef(new OpenAIContentProvider(plugin));

	const loadChatSessionById = useCallback(async (chatSessionId: number) => {
		const data = await ConversationHelper.getConversations(plugin, activeThreadId);

		const selectedChatSession = data.find((c: IChatSession) => c.id === chatSessionId);
		const conversationToLoad = await ConversationHelper.readConversationByFilePath(plugin, selectedChatSession?.path || '');

		if (conversationToLoad) {
			setConversationTitle(conversationToLoad.title);
			setChatSession(conversationToLoad);
		} else {
			console.error('Unable to find selected chat session.');
		}
	}, [activeThreadId]);

	const startNewChatSession = useCallback(async () => {
		const existingChatSessions = await ConversationHelper.getConversations(plugin, activeThreadId);

		let newTitle = 'Untitled';
		let index = 1;

		while (existingChatSessions.some((session) => session.title === newTitle)) {
			newTitle = `Untitled ${index}`;
			index++;
		}

		const newChatSession: IChatSession = {
			color: "default-color",
			context: true,
			creationDate: new Date().toISOString(),
			icon: "default-icon",
			id: Date.now(),
			lastModified: new Date().toISOString(),
			messages: plugin.settings.showWelcomeMessage ? [{
				creationDate: new Date().toISOString(),
				content: `${plugin.settings.systemRolePrompt}`,
				role: "system",
			}, {
				creationDate: new Date().toISOString(),
				content: welcomeMessage || "Welcome to the chat session!",
				role: "assistant",
			}] : [{
				creationDate: new Date().toISOString(),
				content: `${plugin.settings.systemRolePrompt}`,
				role: "system",
			}],
			messagesCount: 0,
			model: plugin.settings.engine,
			path: `${plugin.settings.weaverFolderPath}/threads/base/${newTitle}.bson`,
			tags: [],
			title: newTitle,
			tokens: 0,
		};

		setConversationTitle(newChatSession?.title)
		setChatSession(newChatSession);
		setLastActiveConversationId(newChatSession.id);

		try {
			await ConversationHelper.createNewConversation(plugin, activeThreadId, newChatSession);
		} catch (error) {
			console.error('Error in chat session handling:', error);
		}
	}, [activeThreadId]);

	const resetFlag = useRef(false);

	const onNewChat = () => {
		resetFlag.current = true;
		setChatSession(undefined);
		setConversationTitle(undefined);
	};

	useEffect(() => {
		(async () => {
			try {
				if (chatSession === undefined) {
					if (resetFlag.current) {
						resetFlag.current = false;
						startNewChatSession();
					} else if (selectedConversationId !== null) {
						loadChatSessionById(selectedConversationId);
					} else if (lastActiveConversationId !== null) {
						loadChatSessionById(lastActiveConversationId);
					} else {
						startNewChatSession();
					}
				}
			} catch (error) {
				console.error("Error in useEffect:", error);
			}
		})();
	}, [
		selectedConversationId,
		lastActiveConversationId,
		chatSession,
		loadChatSessionById,
		startNewChatSession,
	]);

	const onBackToHomePage = () => {
		onTabSwitch("home-page");
	}

	const handleUpdateChatSessionTitle = async (newTitle: string) => {
		try {
			const result = await ConversationHelper.updateConversationTitle(plugin, activeThreadId, chatSession?.id ?? -1, newTitle);

			if (result.success) {
				setConversationTitle(newTitle);
			}

			return result;
		} catch (error) {
			console.error('Error updating conversation title:', error);
			return { success: false, errorMessage: error.message };
		}
	};	

	const onSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (inputText.trim() === '') {
			return;
		}

		const creationDate: string = new Date().toISOString();
		const userMessage: IChatMessage = { role: 'user', content: inputText, creationDate };

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
			creationDate: '',
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
		} else if (typeof assistantGeneratedResponse === 'string' && assistantGeneratedResponse.startsWith("Error:")) {
			console.error(assistantGeneratedResponse);
			assistantResponseContent = assistantGeneratedResponse.slice(7);
		} else {
			assistantResponseContent = assistantGeneratedResponse || "I'm sorry, but I am unable to generate a response at this time. Please try again later.";
		}

		const assistantMessage = { role: 'assistant', content: assistantResponseContent, creationDate };

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

	// updateConversation function
	const updateConversation = async (newMessage: IChatMessage, callback: (updatedMessages: IChatMessage[]) => void) => {
		if (chatSession) {
			// Insert the new message into the conversation and get the updated messages array
			const updatedMessages = await ConversationHelper.addNewMessage(plugin, activeThreadId, chatSession.id, newMessage);
			console.log(updatedMessages);
			callback(updatedMessages); // Update the local chat session state
		} else {
			console.error('Chat session is not initialized.');
			return;
		}
	};

	return (
		<div className="chat-view">
			<ChatHeader
				title={conversationTitle}
				onBackToHomePage={onBackToHomePage}
				onUpdateChatSessionTitle={handleUpdateChatSessionTitle}
			></ChatHeader>
			<DialogueTimeline messages={chatSession?.messages} />
			<InputArea
				inputText={inputText}
				setInputText={setInputText}
				onSubmit={onSubmit}
				isLoading={isLoading}
				onCancelRequest={onCancelRequest}
				onNewChat={onNewChat}
			/>
		</div>
	);
}
