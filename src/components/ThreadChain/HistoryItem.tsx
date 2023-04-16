import React, { useEffect, useRef, useState } from 'react';
import { ConversationHelper } from 'helpers/ConversationHelpers';
import Weaver from 'main';

interface HistoryItemProps {
	plugin: Weaver;
	conversation: any;
	onConversationLoad: (conversationId: number) => void;
	onTabSwitch: (tabId: string) => void;
	fetchConversations: () => void;
	index: number;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({
	plugin,
	conversation,
	onConversationLoad,
	onTabSwitch,
	fetchConversations,
	index
}) => {
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	const listItemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
	const [clickedTarget, setClickedTarget] = useState<HTMLElement | null>(null);

	const activeThreadId = 0;

	const handleMouseDown = (event: MouseEvent) => {
		setClickedTarget(event.target as HTMLElement);
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleMouseDown);

		fetchConversations();

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, []);

	useEffect(() => {
		if (showDeleteConfirmation !== null && clickedTarget) {
			const isClickedOutside = !Object.values(listItemRefs.current).some((ref) =>
				ref?.contains(clickedTarget)
			);

			if (isClickedOutside) {
				handleCloseDeleteConfirmation();
			}
		}
	}, [clickedTarget]);

	const handleConversationLoad = (conversationId: number) => {
		onConversationLoad(conversationId);
		onTabSwitch("chat-view");
	};

	const handleDelete = () => {
		setShowDeleteConfirmation(true);
	};

	const handleCloseDeleteConfirmation = () => {
		setShowDeleteConfirmation(false);
	};

	const handleDeleteConfirmed = async (conversationId: number) => {
		await ConversationHelper.deleteConversation(plugin, activeThreadId, conversationId);
		fetchConversations();
		setShowDeleteConfirmation(false);
	};

	return (
		<div
			className="ow-history-list-item"
			ref={(element) => {
				listItemRefs.current[index] = element;
			}}
		>
			<div className="ow-chat-icon">
				<div className="ow-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
				</div>
				<div className="ow-verical-line"></div>
			</div>
			<div className="ow-list-item">
				<div className="ow-info">
					<div className="ow-title">
						<span>
							{conversation.title}
						</span>
						<div className="ow-actions">
							{showDeleteConfirmation === false ? (
								<button
									className="btn-delete-conversation"
									onClick={handleDelete}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
								</button>
							) : (
								<div className="delete-confirmation-dialog">
									<button className="btn-confirm" onClick={() => {
										handleDeleteConfirmed(conversation.id)
									}}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
									</button>
									<button className="btn-cancel" onClick={() => {
										handleCloseDeleteConfirmation()
									}}>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
									</button>
								</div>
							)}
							<button
								className="btn-open-chat"
								onClick={() => handleConversationLoad(conversation.id)}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
							</button>
						</div>
						<div className="ow-msg-count">
							{conversation.messagesCount}
						</div>
					</div>
					<div className="creation-date">
						{conversation.creationDate.substring(0, 10)}
					</div>
				</div>
				<div className="ow-chat-description">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin varius sem est. Suspendisse semper dolor facilisis sapien egestas rhoncus.
				</div>
				<div className="item-ow-actions">
				</div>
			</div>
		</div>
	);
};
