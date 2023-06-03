import { IConversation } from "interfaces/IThread"
import Weaver from "main"
import React, { useEffect, useRef, useState } from "react"
import { ThreadManager } from "utils/ThreadManager";
import { ConversationManager } from "utils/ConversationManager";

interface ThreadListItemProps {
	plugin: Weaver;
	conversation: IConversation;
	onConversationDeleted: (id: string) => void;
	onTabSwitch: (tabId: string) => void;
	onConversationLoad: (conversation: IConversation) => void;
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({
	plugin,
	conversation,
	onConversationDeleted,
	onTabSwitch,
	onConversationLoad
}) => {
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	const listItemRef = useRef<HTMLDivElement | null>(null);
	const deleteConfirmationDialogRef = useRef<HTMLDivElement | null>(null);

	const handleMouseDown = (event: MouseEvent) => {
		if (listItemRef.current && !listItemRef.current.contains(event.target as HTMLElement)) {
			setShowDeleteConfirmation(false);
		}
	};

	useEffect(() => {
		document.addEventListener("mousedown", handleMouseDown);

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, []);

	const handleDelete = () => {
		setShowDeleteConfirmation(true);
	};

	const handleCloseDeleteConfirmation = () => {
		setShowDeleteConfirmation(false);
	};

	const handleDeleteConfirmed = async (id: string) => {
		setShowDeleteConfirmation(false);
		ConversationManager.deleteConversation(plugin, id);
		onConversationDeleted(id);
	};

	const handleConversationLoad = () => {
		onTabSwitch("conversation-page");
		onConversationLoad(conversation);
	};

	return (
		<div
			className={`ow-thread-list-item ${plugin.settings.threadViewCompactMode === true ? 'ow-compact-item' : null} ow-mode-${conversation.mode}`}
			ref={listItemRef}
		>
			<div className="ow-chat-icon">
				<div className="ow-icon">
					{conversation.model === "gpt-4" ? (
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
					) : (
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
					)}
				</div>
			</div>
			<div className="ow-card-content">
				<div className="ow-chat-title">
					<div className="ow-title-wrapper">
						<span className="ow-title">
							<span>
								{conversation.title}
							</span>
						</span>
						<span className="ow-date">{conversation.creationDate.substring(0, 10)}</span>
					</div>
					<div className={`ow-user-actions ${showDeleteConfirmation === true ? 'show' : ''}`}>
						{showDeleteConfirmation === false ? (
							<>
								<button
									className="ow-btn-delete-conversation"
									onClick={handleDelete}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
								</button>
							</>
						) : (
							<div className="delete-confirmation-dialog" ref={deleteConfirmationDialogRef}>
								<button className="ow-btn-confirm" onClick={() => {
									handleDeleteConfirmed(conversation.id)
								}}>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
								</button>
								<button className="ow-btn-cancel" onClick={() => {
									handleCloseDeleteConfirmation()
								}}>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
								</button>
							</div>
						)}
						<button
							className="btn-open-chat"
							onClick={() => handleConversationLoad()}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
						</button>
					</div>
					<div className={`ow-messages-count ${showDeleteConfirmation === true ? 'show' : ''}`}>
						{conversation.messages.length - 1}
					</div>
				</div>
			</div>
		</div>
	)
}
