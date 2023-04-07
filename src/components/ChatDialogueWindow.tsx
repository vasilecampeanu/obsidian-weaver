import React, { useState, useEffect } from 'react';
import Weaver from 'main';

// Helpers
import { ConversationHelper } from 'helpers/ConversationHelpers';

// React Component
import { ChatHeader } from './ChatHeader';

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

export interface ChatDialogueWindow {
	plugin: Weaver,
	selectedConversationId: number | null,
	lastActiveConversationId: number | null,
	setLastActiveConversationId: (id: number) => void,
	onTabSwitch: (tabId: string) => void
}

export const ChatDialogueWindow: React.FC<ChatDialogueWindow> = ({
	plugin,
	selectedConversationId,
	lastActiveConversationId,
	setLastActiveConversationId,
	onTabSwitch
}) => {
	const [chatSession, setChatSession] = useState<IChatSession | undefined>(undefined)

	// TODO: This needs to be stored somehere else.
	// The user should be able to choose from multiple profiles to load by default.
	const activeProfileId = 0;

	const loadChatSessionById = async (chatSessionId: number) => {
		const data = await ConversationHelper.readConversations(plugin, activeProfileId);
		const selectedChatSession = data.find((c: IChatSession) => c.id === chatSessionId);

		if (selectedChatSession) {
			setChatSession(selectedChatSession);
		} else {
			console.error('Unable to find selected chat session!');
		}
	};

	const startNewChatSession = async () => {
		const newChatSession: IChatSession = {
			id: Date.now(),
			title: `Untitled`,
			timestamp: new Date().toISOString(),
			messages: [] // TODO: Potentially insert a welcome message by default.
		};

		setChatSession(newChatSession);
		setLastActiveConversationId(newChatSession.id);

		try {
			const existingChatSessions = await ConversationHelper.readConversations(plugin, activeProfileId);
			const mergedChatSessions = [...existingChatSessions, newChatSession];

			const uniqueChatSessions = mergedChatSessions.filter((chatSession, index, array) => {
				return index === array.findIndex((c) => c.id === chatSession.id);
			});

			ConversationHelper.writeConversations(plugin, activeProfileId, uniqueChatSessions);
		} catch (error) {
			console.error('Error in chat session handling:', error);
		}
	};

	useEffect(() => {
		if (chatSession === undefined) {
			if (selectedConversationId !== null) {
				loadChatSessionById(selectedConversationId);
			} else if (lastActiveConversationId !== null) {
				loadChatSessionById(lastActiveConversationId);
			} else {
				startNewChatSession();
			}
		}
	}, [selectedConversationId, lastActiveConversationId, chatSession]);

	const onBackToHomePage = () => {
		onTabSwitch("home-page");
	}

	const onUpdateConversationTitle = async (newTitle: string) => {
		if (chatSession) {
			const data = await ConversationHelper.readConversations(plugin, activeProfileId);
			const chatSessionIndex = data.findIndex((c: IChatSession) => c.id === chatSession.id);

			if (chatSessionIndex !== -1) {
				data[chatSessionIndex].title = newTitle;

				ConversationHelper.writeConversations(plugin, activeProfileId, data);

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
				console.error('Conversation not found in the existing conversations array.');
			}
		}
	};

	return (
		<div className="chat-view">
			<ChatHeader title={chatSession?.title} onBackToHomePage={onBackToHomePage} onUpdateChatSessionTitle={onUpdateConversationTitle}></ChatHeader>
		</div>
	)
}
