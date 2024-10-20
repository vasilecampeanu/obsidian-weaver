import { Icon } from "components/primitives/Icon";
import { EChatModels } from "enums/EProviders";
import { useConversation } from "hooks/useConversation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatModelSwitcher } from "./ChatModelSwitcher";

interface ChatHeaderProps {}

export const ChatHeader: React.FC<ChatHeaderProps> = () => {
	const { conversation, updateConversationTitle, updateConversationModel } = useConversation();
	const [isEditing, setIsEditing] = useState(false);
	const [editableTitle, setEditableTitle] = useState<string>("");
	const [isChatModelSwitcherOpen, setIsChatModelSwitcherOpen] = useState(false);
	
	const switchModelButtonRef = useRef<HTMLButtonElement>(null);	
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

	const handleModelSelect = async (model: EChatModels) => {
		if (model !== conversation?.default_model_slug) {
			updateConversationModel(model);
		}
	};

	const togglePopover = () => {
		setIsChatModelSwitcherOpen((prev) => !prev);
	};

	return (
		<div className="ow-chat-header">
			<div className="ow-header-actions">
				<button className="ow-btn-back">
					<Icon iconId={"arrow-left"} />
				</button>
				<button
					ref={switchModelButtonRef}
					className="ow-model-info-select"
					onClick={togglePopover}
				>
					<span className="icon">
						<Icon iconId={"sparkles"} />
					</span>
					<span className="model-name">
						{conversation?.default_model_slug
							? conversation.default_model_slug.toUpperCase()
							: "SELECT MODEL"}
					</span>
					<span className="icon">
						<Icon iconId={"chevron-down"} />
					</span>
				</button>
				<ChatModelSwitcher
					referenceElement={switchModelButtonRef}
					placement="bottom-start"
					isChatModelSwitcherOpen={isChatModelSwitcherOpen}
					setIsChatModelSwitcherOpen={setIsChatModelSwitcherOpen}
					onSelect={handleModelSelect}
				/>
			</div>
			<div className="ow-chat-titlebar">
				<div className="ow-chat-title-container">
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
							style={{ width: "100%" }}
						/>
					) : (
						<div
							className="ow-chat-title"
							onDoubleClick={handleDoubleClick}
						>
							{conversation?.title}
						</div>
					)}
				</div>
				<button className="ow-chat-title-options">
					<Icon iconId={"ellipsis"} />
				</button>
			</div>
		</div>
	);
};
