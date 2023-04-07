import React, { useState } from 'react';

interface ChatHeaderProps {
	title: string | undefined;
	onBackToHomePage: () => void;
	onUpdateChatSessionTitle: (newTitle: string | undefined) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	title,
	onBackToHomePage,
	onUpdateChatSessionTitle,
}) => {
	const [titleInput, setTitleInput] = useState<string | undefined>('');
	const [isTitleEditing, setIsTitleEditing] = useState<boolean>(false);

	const handleBlur = () => {
		setIsTitleEditing(false);

		if (titleInput?.trim() === '') {
			setTitleInput(title);
		} else {
			onUpdateChatSessionTitle(titleInput);
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
						/>
					) : (
						<span onDoubleClick={handleDoubleClick}>{title}</span>
					)}
				</div>
			</div>
		</div>
	);
};
