import { FileSystemAdapter, normalizePath } from 'obsidian';
import React, { useEffect, useRef, useState } from 'react';
import Weaver from 'main'

import { IChatSession } from './chat/ConversationDialogue';
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
	const [conversations, setConversations] = useState<IChatSession[]>([]);

	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<number | null>(null);
	const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);

	const listItemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
	const [clickedTarget, setClickedTarget] = useState<HTMLElement | null>(null);

	const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);

	const activeProfileId = 0;

	useEffect(() => {
		document.addEventListener("mousedown", handleMouseDown);

		fetchConversations();

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowWelcomePrompt(true);
		}, 500);

		return () => {
			clearTimeout(timer);
		};
	}, []);

	const handleMouseDown = (event: MouseEvent) => {
		setClickedTarget(event.target as HTMLElement);
	};

	useEffect(() => {
		if (showDeleteConfirmation !== null && clickedTarget) {
			const isClickedOutside = !Object.values(listItemRefs.current).some((ref) =>
				ref?.contains(clickedTarget)
			);

			if (isClickedOutside) {
				closeDeleteConfirmation();
			}
		}
	}, [clickedTarget]);

	const fetchConversations = async () => {
		const data = await ConversationHelper.readConversations(plugin, activeProfileId);
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
		await ConversationHelper.deleteConversation(plugin, activeProfileId, conversationId);
		fetchConversations();
		setShowDeleteConfirmation(null);
		setConversationToDelete(null);
	};

	return (
		<div className="home-page">
			<div className="header">
				<div className="tool-bar">
					<div className="title">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="14" width="9" height="6" rx="2"></rect><rect x="6" y="4" width="16" height="6" rx="2"></rect><path d="M2 2v20"></path></svg>
						<span>Chats</span>
					</div>
					<button
						className="btn-new-chat"
						onClick={() => {
							handleNewChat();
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
					conversations.slice().sort((a, b) => {
						const dateA = new Date(a.timestamp);
						const dateB = new Date(b.timestamp);
						return dateB.getTime() - dateA.getTime();
					}).map((conversation, index) => (
						<div
							className="history-list-item"
							key={index}
							ref={(element) => {
								listItemRefs.current[index] = element;
							}}
						>
							<div className="icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
							</div>
							<div className="info">
								<span className="title">
									{conversation.title}
								</span>
								<span className="timestamp">
									{conversation.timestamp.substring(0, 10)}
								</span>
							</div>
							<div className={`item-actions ${showDeleteConfirmation === conversation.id ? 'show' : ''}`}>
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
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
											</button>
											<button className="btn-cancel" onClick={closeDeleteConfirmation}>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
											</button>
										</div>
									) : (
										<button
											className="btn-delete-conversation"
											onClick={() => {
												openDeleteConfirmation(conversation.id);
											}}
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
										</button>
									)}
									<button
										className="btn-open-chat"
										onClick={() => {
											handleConversationLoad(conversation.id);
										}}
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
									</button>
								</div>
								<span className="messaje-count">
									{conversation.messages.length}
								</span>
							</div>
						</div>
					))
				) : (
					showWelcomePrompt && (
						<div className="welcome-prompt">
							{/* 
							<div className="info">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v12"></path><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path><path d="M15 6a9 9 0 0 0-9 9"></path><path d="M18 15v6"></path><path d="M21 18h-6"></path></svg>
								<div className="message">
									Obsidian Weaver
								</div>
							</div>
							<div className="version">
								preview: v0.3.4
							</div>
							<button
								onClick={() => {
									handleNewChat();
								}}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
								<span>
									Create New Conversation
								</span>
							</button> 
							*/}
						</div>
					)
				)}
			</div>
		</div>
	)
}
