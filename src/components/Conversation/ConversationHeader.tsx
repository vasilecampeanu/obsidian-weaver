import { IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { ConversationManager } from "utils/ConversationManager";
import { ThreadManager } from "utils/ThreadManager";

interface ConversationHeaderProps {
	plugin: Weaver;
	conversation: IConversation | undefined;
	onTabSwitch: (tabId: string) => void;
	setConversationSession: React.Dispatch<React.SetStateAction<IConversation | undefined>>;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
	plugin,
	onTabSwitch,
	conversation,
	setConversationSession
}) => {
	const [titleInput, setTitleInput] = useState<string | undefined>('');
	const [isTitleEditing, setIsTitleEditing] = useState<boolean>(false);
	const [inputError, setInputError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | undefined>('');
	const [context, setContext] = useState<boolean>();

	const timeoutRef = useRef<NodeJS.Timeout>();

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		setContext(conversation?.context)
	}, [conversation])

	const validateTitle = (input: string): boolean => {
		const pattern = /[^a-zA-Z0-9\s-_.,!(){}'"+=%@&$*~`?;]/;
		return pattern.test(input) === false;
	};

	const handleBlur = async () => {
		setIsTitleEditing(false);

		// Set the initial titleInput as conversation?.title
		const initialTitleInput = conversation?.title;

		if (titleInput?.trim() === '') {
			setTitleInput(initialTitleInput);
		} else if (titleInput === initialTitleInput) {
			return;
		} else {
			if (!validateTitle(titleInput || '')) {
				setInputError(true);
				setErrorMessage('Illegal characters in the title!');

				timeoutRef.current = setTimeout(() => {
					setInputError(false);
					setErrorMessage('');
				}, 1500);

				return;
			}

			try {
				// Get all existing conversations to check for duplicate titles
				const allConversations = await ThreadManager.getAllConversations(plugin, plugin.settings.weaverFolderPath + '/threads/base');
				// Ensure the title is unique
				const uniqueTitle = ConversationManager.getUniqueTitle(titleInput as string, allConversations);
				const result = await ConversationManager.updateConversationTitleById(plugin, conversation!?.id, uniqueTitle);

				if (!result.success) {
					setInputError(true);
					setErrorMessage(result.errorMessage);

					timeoutRef.current = setTimeout(() => {
						setInputError(false);
						setErrorMessage('');
					}, 1500);
				} else {
					setConversationSession(prevConversation => {
						if (prevConversation) {
							return { 
								...prevConversation, 
								title: uniqueTitle 
							};
						} else {
							return prevConversation;
						}
					});

					setTitleInput(uniqueTitle);
				}
			} catch (error) {
				console.error(error);
			}
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleBlur();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			setIsTitleEditing(false);
			setTitleInput(conversation?.title);
		}
	};

	const handleDoubleClick = () => {
		setIsTitleEditing(true);
		setTitleInput(conversation?.title);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			setInputError(false);
			setErrorMessage('');
		}
	};

	const handleTabSwitch = async () => {
		onTabSwitch("thread-page");
		plugin.settings.lastConversationId = "";
		plugin.settings.loadLastConversationState = false;
		await plugin.saveSettings();
	}

	const handleToggleContext = () => {
		const newContext = !context;
		setContext(newContext);

		setConversationSession(prevConversation => {
			if (prevConversation) {
				return { ...prevConversation, context: newContext };
			} else {
				return;
			}
		});

		conversation!.context = newContext;

		ConversationManager.updateConversation(plugin, conversation as IConversation);
	}

	return (
		<div className="ow-conversation-header">
			<div className="ow-user-actions-left">
				<button className="ow-btn-back" onClick={handleTabSwitch}>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
				</button>
			</div>
			<div className="ow-conversation-title">
				{isTitleEditing ? (
					<input
						autoFocus
						type="text"
						value={titleInput}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
						onChange={(e) => setTitleInput(e.target.value)}
					/>
				) : (
					<span
						onDoubleClick={handleDoubleClick}
						className={`ow-title ${inputError ? 'ow-error-messaje' : ''}`}
					>
						{errorMessage ? errorMessage : conversation?.title}
					</span>
				)}
			</div>
			<div className="ow-user-actions-right">
				{true ? (
					<button className={`ow-btn-context ${context === true ? 'ow-context-enabled' : 'ow-context-disabled'}`} onClick={handleToggleContext}>
						{context === true ? (
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link-2"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" x2="16" y1="12" y2="12"></line></svg>
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link-2-off"><path d="M9 17H7A5 5 0 0 1 7 7"></path><path d="M15 7h2a5 5 0 0 1 4 8"></path><line x1="8" x2="12" y1="12" y2="12"></line><line x1="2" x2="22" y1="2" y2="22"></line></svg>
						)}
					</button>
				) : null}
			</div>
		</div>
	)
}
