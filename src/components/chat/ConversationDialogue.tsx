import React, { useState, useEffect, useCallback } from 'react';
import Weaver from 'main';

// Helpers
import { ConversationHelper } from 'helpers/ConversationHelpers';

// React Component
import { ChatHeader } from './Header';
import { MessageBubbleList } from './MessageBubbleList';

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
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// TODO: This needs to be stored somewhere else.
	// The user should be able to choose from multiple profiles to load by default.
	const activeThreadId = 0;

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
			messages: [] // TODO: Potentially insert a welcome message by default.
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
		</div>
	)
}
