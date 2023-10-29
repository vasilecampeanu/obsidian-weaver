import { useChat } from "hooks/useChat";
import Weaver from "main";
import { TabId } from "types/GeneralTypes";
import React, { useState, useRef, useEffect } from "react";

interface ChatHeaderProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
	plugin,
	handleTabSwitcher,
}) => {
	const { conversation } = useChat();

	const [isEditing, setIsEditing] = useState(false);
	const [editableTitle, setEditableTitle] = useState(conversation?.title || "");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
		}
	}, [isEditing]);

	const handleDoubleClick = () => {
		setIsEditing(true);
	};

	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditableTitle(e.target.value);
	};

	const handleTitleBlur = () => {
		setIsEditing(false);
	};

	return (
		<div className="ow-chat-header">
			<button
				className="ow-back-btn"
				onClick={() => { handleTabSwitcher('THREAD') }}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
			</button>
			<div className="ow-chat-title">
				{isEditing ? (
					<input
						type="text"
						value={editableTitle}
						onChange={handleTitleChange}
						onBlur={handleTitleBlur}
						ref={inputRef}
					/>
				) : (
					<span className="ow-title" onDoubleClick={handleDoubleClick}>
						{conversation?.title}
					</span>
				)}
			</div>
		</div>
	);
}
