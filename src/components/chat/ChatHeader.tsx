import { Icon } from "components/primitives/Icon";
import { useConversation } from "hooks/useConversation";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatHeaderProps {}

export const ChatHeader: React.FC<ChatHeaderProps> = () => {
	const { conversation, updateConversationTitle } = useConversation();
	const [isEditing, setIsEditing] = useState(false);
	const [editableTitle, setEditableTitle] = useState<string>("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus();
			const length = inputRef.current.value.length;
			inputRef.current.setSelectionRange(length, length);
		}
	}, [isEditing]);

	const handleDoubleClick = () => {
		if (conversation?.title) {
			setEditableTitle(conversation.title);
			setIsEditing(true);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEditableTitle(e.target.value);
	};

	const handleSubmit = useCallback(async () => {
		const trimmedTitle = editableTitle.trim();
		if (trimmedTitle && trimmedTitle !== conversation?.title) {
			await updateConversationTitle(trimmedTitle);
		}
		setIsEditing(false);
	}, [editableTitle, conversation, updateConversationTitle]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSubmit();
		} else if (e.key === "Escape") {
			setIsEditing(false);
		}
	};

	const handleBlur = () => {
		handleSubmit();
	};

	return (
		<div className="ow-chat-header">
			<button className="ow-model-info-select">
				<span>
					<Icon iconId={"sparkles"} />
				</span>
				<span>{conversation?.default_model_slug.toUpperCase()}</span>
				<span>
					<Icon iconId={"chevron-down"} />
				</span>
			</button>
			<div className="ow-chat-title" onDoubleClick={handleDoubleClick}>
				{isEditing ? (
					<input
						ref={inputRef}
						type="text"
						value={editableTitle}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						className="ow-chat-title-input"
						aria-label="Edit conversation title"
					/>
				) : (
					conversation?.title
				)}
			</div>
		</div>
	);
};
