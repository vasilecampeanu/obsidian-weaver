import React, { useEffect, useRef, useState } from 'react';
import { ConversationHelper } from 'helpers/ConversationHelpers';
import Weaver from 'main';
import { ConversationBsonManager } from 'utils/ConversationBsonManager';
import { MarkdownRenderer, TFile } from 'obsidian';

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
	const [clickedTarget, setClickedTarget] = useState<HTMLElement | null>(null);

	const [description, setDescription] = useState<string | undefined>(conversation.description);
	const [descriptionInput, setDescriptionInput] = useState<string | undefined>('');
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [inputError, setInputError] = useState<boolean>(false);

	const [htmlDescriptionContent, setHtmlDescriptionContent] = useState<{ __html: string } | null>(null);

	const [errorMessage, setErrorMessage] = useState<string | undefined>('');
	const [descriptionContent, setDescriptionContent] = useState<string | null>(null);

	const timeoutRef = useRef<NodeJS.Timeout>();
	const listItemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
	const conversationDescriptionContentRef = useRef<HTMLDivElement>(null);

	const activeThreadId = plugin.settings.activeThreadId;

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
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// Combine useEffect hooks that listen for description and errorMessage changes
	useEffect(() => {
		const renderDescription = async () => {
			if (errorMessage) {
				setHtmlDescriptionContent({ __html: errorMessage });
			} else if (!description) {
				setHtmlDescriptionContent({ __html: 'No description' });
			} else {
				const context = {
					cache: {},
					async onload(source: string, el: HTMLElement, ctx: any) {
						return ctx;
					},
					async onunload() { },
				};

				// Replace internal image links with <img> tags
				const descriptionWithImages = description.replace(
					/!\[\[(.+?)\]\]/g,
					(_, internalLink) => {
						const file = plugin.app.vault.getAbstractFileByPath(internalLink);
						if (file && file instanceof TFile) {
							return `<img src="${plugin.app.vault.getResourcePath(file)}" alt="${internalLink}" />`;
						}
						return `![[${internalLink}]]`;
					}
				);

				const tempEl = document.createElement('div');
				await MarkdownRenderer.renderMarkdown(descriptionWithImages, tempEl, '', context as any);

				setHtmlDescriptionContent({ __html: tempEl.innerHTML });
			}
		};

		renderDescription();
	}, [description, errorMessage]);

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
		await ConversationBsonManager.deleteConversation(plugin, activeThreadId, conversationId);
		fetchConversations();
		setShowDeleteConfirmation(false);
	};

	const onUpdateDescription = async (
		newDescription: string | undefined,
	): Promise<{ success: boolean; errorMessage?: string }> => {
		ConversationBsonManager.updateConversationDescription(plugin, activeThreadId, conversation.id, newDescription || '');
		setDescription(newDescription);
		return { success: true };
	};

	const handleBlur = async () => {
		setIsEditing(false);

		if (descriptionInput?.trim() === '') {
			setDescriptionInput(description);
		} else if (descriptionInput === description) {
			return;
		} else {
			try {
				const result = await onUpdateDescription(descriptionInput);

				if (!result.success) {
					setInputError(true);
					setErrorMessage(result.errorMessage);

					timeoutRef.current = setTimeout(() => {
						setInputError(false);
						setErrorMessage('');
					}, 1500);
				}

				setDescription(descriptionInput); // Corrected this line
			} catch (error) {
				console.error(error);
			}
		}
	};

	// ...

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleBlur();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			setIsEditing(false);
			setDescriptionInput(description);
		}
	};

	// ...

	const adjustTextAreaHeight = (target: HTMLTextAreaElement) => {
		target.style.height = 'auto';
		target.style.height = `${target.scrollHeight}px`;
	};

	const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
		adjustTextAreaHeight(e.target as HTMLTextAreaElement);
	};

	const handleDoubleClick = () => {
		setIsEditing(true);
		setDescriptionInput(description);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			setInputError(false);
			setErrorMessage('');
		}
	};

	useEffect(() => {
		if (isEditing) {
			const textareaElement = document.querySelector('.ow-chat-description textarea');
			if (textareaElement) {
				setTimeout(() => {
					adjustTextAreaHeight(textareaElement as HTMLTextAreaElement);
				}, 0);
			}
		}
	}, [isEditing]);

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
				<div className="ow-vertical-line"></div>
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
					{isEditing ? (
						<textarea
							autoFocus
							value={descriptionInput}
							onBlur={handleBlur}
							onInput={handleInput}
							onKeyDown={handleKeyDown}
							onChange={(e) => setDescriptionInput(e.target.value)}
						/>
					) : (
						<div
							onDoubleClick={handleDoubleClick}
							className={`description-content ${inputError ? 'error-message' : ''}`}
							dangerouslySetInnerHTML={htmlDescriptionContent || { __html: '' }}
						/>
					)}
				</div>
				<div className="item-ow-actions">
				</div>
			</div>
		</div>
	);
};
