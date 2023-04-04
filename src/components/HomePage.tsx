import { FileSystemAdapter, normalizePath } from 'obsidian';
import React, { useEffect, useState } from 'react';
import Weaver from 'main'

import { IConversation } from './ChatView';
import { ConversationHelper } from 'helpers/ConversationHelpers';

export interface HomePage {
	plugin: Weaver,
	onTabSwitch: (tabId: string) => void,
	onConversationLoad: (conversationId: number) => void,
	onNewConversation: () => void;
}

export const HomePage: React.FC<HomePage> = ({
	plugin,
	onTabSwitch,
	onConversationLoad,
	onNewConversation
}) => {
	const [conversations, setConversations] = useState<IConversation[]>([]);

	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);
	const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

	useEffect(() => {
		fetchConversations();
	}, []);

	const fetchConversations = async () => {
		const data = await ConversationHelper.readConversations(plugin);
		setConversations(data);
	};

	const handleNewChat = () => {
		onNewConversation();
		onTabSwitch("chat-view");
	}

	const handleConversationLoad = (conversationId: number) => {
		onConversationLoad(conversationId);
		onTabSwitch("chat-view");
	};

	const openDeleteConfirmation = (conversationId: number) => {
		setConversationToDelete(conversationId);
		setShowDeleteConfirmation(conversationId);
	};

	const closeDeleteConfirmation = () => {
		setShowDeleteConfirmation(null);
		setConversationToDelete(null);
	};

	const handleDeleteConversation = async (conversationId: number) => {
		await ConversationHelper.deleteConversation(plugin, conversationId);
		fetchConversations();
		setShowDeleteConfirmation(null);
		setConversationToDelete(null);
	};
	
	return (
		<div className="home-page">
			<div className="header">
				<div className="tool-bar">
					<div className="title">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="14" width="9" height="6" rx="2"></rect><rect x="6" y="4" width="16" height="6" rx="2"></rect><path d="M2 2v20"></path></svg>
						<span>Chats</span>
					</div>
					<button
						className="btn-new-chat"
						onClick={() => {
							handleNewChat();
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
					</button>
				</div>
				<div className="info-bar">
					<div className="chat-count">
						Number of chats: {conversations.length}
					</div>
				</div>
			</div>
			<div className="chat-history">
				{conversations.length > 0 ? (
					conversations.map((conversation, index) => (
						<div
							className="history-list-item"
							key={index}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
							<div className="info">
								<span className="title">
									{conversation.title}
								</span>
								<span className="timestamp">
									{conversation.timestamp}
								</span>
							</div>
							<div className="item-actions">
								<div className="actions">
									{showDeleteConfirmation === conversation.id ? (
										<div className="delete-confirmation-dialog">
											<button
												className="btn-confirm"
												onClick={() => {
													if (conversationToDelete !== null) {
														handleDeleteConversation(conversationToDelete);
													}
												}}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
											</button>
											<button className="btn-cancel" onClick={closeDeleteConfirmation}>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
											</button>
										</div>
									) : (
										<button
											className="btn-delete-conversation"
											onClick={() => {
												openDeleteConfirmation(conversation.id);
											}}
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
										</button>
									)}
									<button
										className="btn-open-chat"
										onClick={() => {
											handleConversationLoad(conversation.id);
										}}
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
									</button>
								</div>
								<span className="messaje-count">
									{conversation.messages.length}
								</span>
							</div>
						</div>
					))
				) : (
					<div className="welcome-prompt">
						No conversations available. Click the "+" button to start a new chat.
					</div>
				)}
			</div>
		</div>
	)
}
