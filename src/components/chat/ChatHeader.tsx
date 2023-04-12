import React, { useEffect, useState } from 'react';

interface ChatHeaderProps {
	title: string | undefined;
	onBackToHomePage: () => void;
	onUpdateChatSessionTitle: (newTitle: string | undefined) => Promise<void>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	title,
	onBackToHomePage,
	onUpdateChatSessionTitle,
}) => {
	const [titleInput, setTitleInput] = useState<string | undefined>('');
	const [isTitleEditing, setIsTitleEditing] = useState<boolean>(false);
	const [inputError, setInputError] = useState<boolean>(false);

	useEffect(() => {
		(async () => {
			console.log(title);
		})();
	}, []);

	const handleBlur = async () => {
		setIsTitleEditing(false);
	
		if (titleInput?.trim() === '') {
			setTitleInput(title);
		} else {
			try {
				await onUpdateChatSessionTitle(titleInput);
				setTitleInput(titleInput); // Update the titleInput state after updating the title successfully
			} catch (error) {
				if (error.message === 'The provided title already exists. Please choose a different title.') {
					setInputError(true);
					setTimeout(() => setInputError(false), 1000);
				} else {
					// Handle other errors if necessary
				}
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
							style={inputError ? { borderColor: 'red' } : {}}
						/>
					) : (
						<span onDoubleClick={handleDoubleClick}>{title}</span>
					)}
				</div>
			</div>
		</div>
	);
};
