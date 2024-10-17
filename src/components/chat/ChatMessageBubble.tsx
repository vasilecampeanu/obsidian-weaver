import { Icon } from "components/primitives/Icon";
import { useConversation } from "hooks/useConversation";
import { IMessageNode } from "interfaces/IConversation";
import React, { useState } from "react";

interface ChatMessageBubbleProps {
	messageNode: IMessageNode;
	hasBranches: boolean;
	currentBranchIndex: number;
	totalBranches: number;
	onPrevBranch: () => void;
	onNextBranch: () => void;
	isLatest?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
	messageNode,
	hasBranches,
	currentBranchIndex,
	totalBranches,
	onPrevBranch,
	onNextBranch,
	isLatest,
}) => {
	const { regenerateAssistantMessage, editUserMessage } = useConversation();
	const [isCopied, setIsCopied] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(
		messageNode.message?.content.parts.join("\n") || ""
	);
	const message = messageNode.message;

	if (!message) return null;

	const handleCopyClick = () => {
		navigator.clipboard.writeText(message.content.parts.join("\n"));
		setIsCopied(true);
		setTimeout(() => {
			setIsCopied(false);
		}, 1500);
	};

	const handleEditClick = () => {
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditedContent(message.content.parts.join("\n"));
	};

	const handleSaveEdit = async () => {
		if (editedContent.trim() === "") {
			// TODO: Optionally, handle empty content (e.g., show a warning)
			return;
		}

		await editUserMessage(messageNode.id, editedContent.trim());
		setIsEditing(false);
	};

	return (
		<div className={`ow-chat-message-bubble ${message.author.role} ${isLatest ? "latest" : ""}`}>
			<div className="message-content">
				{isEditing ? (
					<div className="editing-area">
						<textarea
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							rows={3}
							className="ow-edit-textarea"
						/>
						<div className="editing-buttons">
							<button
								className="ow-btn save"
								onClick={handleSaveEdit}
							>
								Save
							</button>
							<button
								className="ow-btn cancel"
								onClick={handleCancelEdit}
							>
								Cancel
							</button>
						</div>
					</div>
				) : (message.content.parts.join("\n"))}
			</div>
			<div className="ow-message-utility-bar">
				{hasBranches && (
					<div className="ow-branch-navigation">
						<button className="ow-btn" onClick={onPrevBranch}>
							<Icon iconId={"chevron-left"} />
						</button>
						<span className="ow-branch-index">
							{currentBranchIndex + 1} / {totalBranches}
						</span>
						<button className="ow-btn" onClick={onNextBranch}>
							<Icon iconId={"chevron-right"} />
						</button>
					</div>
				)}
				{message.author.role === "assistant" && (
					<div className="ow-user-actions">
						<button className="ow-btn" onClick={handleCopyClick}>
							<Icon iconId={isCopied ? "check" : "copy"} />
						</button>
						<button
							className="ow-btn"
							onClick={() =>
								regenerateAssistantMessage(messageNode.id)
							}
						>
							<Icon iconId={"refresh-ccw"} />
						</button>
					</div>
				)}
				{message.author.role === "user" && !isEditing && (
					<div className="ow-user-actions">
						<button
							className="ow-btn edit"
							onClick={handleEditClick}
						>
							<Icon iconId={"pen"} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
