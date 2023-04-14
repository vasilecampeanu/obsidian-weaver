import React, { useEffect, useRef, useState } from 'react';

interface ChatHeaderProps {
	title: string | undefined;
	onBackToHomePage: () => void;
	onUpdateChatSessionTitle: (newTitle: string | undefined) => Promise<{ success: boolean; errorMessage?: string }>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	title,
	onBackToHomePage,
	onUpdateChatSessionTitle,
}) => {
	const [titleInput, setTitleInput] = useState<string | undefined>('');
	const [isTitleEditing, setIsTitleEditing] = useState<boolean>(false);
	const [inputError, setInputError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | undefined>('');

	const timeoutRef = useRef<NodeJS.Timeout>();

	const validateTitle = (input: string): boolean => {
		const pattern = /[^a-zA-Z0-9\s-_.,!()'+%@&${}~`]/;
		return pattern.test(input) === false;
	};

	const handleBlur = async () => {
		setIsTitleEditing(false);

		if (titleInput?.trim() === '') {
			setTitleInput(title);
		} else if (titleInput === title) {
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
				const result = await onUpdateChatSessionTitle(titleInput);

				if (!result.success) {
					setInputError(true);
					setErrorMessage(result.errorMessage);

					timeoutRef.current = setTimeout(() => {
						setInputError(false);
						setErrorMessage('');
					}, 1500);
				}

				setTitleInput(titleInput);
			} catch (error) {
				console.log(error);
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
			setTitleInput(title);
		}
	};

	const handleDoubleClick = () => {
		setIsTitleEditing(true);
		setTitleInput(title);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			setInputError(false);
			setErrorMessage('');
		}
	};

	return (
		<div className="header">
			<div className="tool-bar">
				<button className="btn-back" onClick={onBackToHomePage}>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
				</button>
				<div className="title">
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
						<span onDoubleClick={handleDoubleClick} className={`conversation-title ${inputError ? 'error-messaje' : ''}`}>
							{errorMessage ? errorMessage : title}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};
