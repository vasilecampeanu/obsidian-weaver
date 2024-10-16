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
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
	messageNode,
	hasBranches,
	currentBranchIndex,
	totalBranches,
	onPrevBranch,
	onNextBranch,
}) => {
	const { regenerateAssistantMessage } = useConversation();
	const [isCopied, setIsCopied] = useState(false);
	const message = messageNode.message;

	if (!message) return null;

	const handleCopyClick = () => {
		navigator.clipboard.writeText(message.content.parts.join("\n"));
		setIsCopied(true);
		setTimeout(() => {
			setIsCopied(false);
		}, 1000);
	};

	return (
		<div className={`ow-chat-message-bubble ${message.author.role}`}>
			<div className="message-content">
				{message.content.parts.join("\n")}
			</div>
			<div className="ow-message-utility-bar">
				{hasBranches && (
					<div className="ow-branch-navigation">
						<button 
							className="ow-btn"
							onClick={onPrevBranch}
						>
							<Icon iconId={"chevron-left"} />
						</button>
						<span className="ow-branch-index">
							{currentBranchIndex + 1} / {totalBranches}
						</span>
						<button 
							className="ow-btn"
							onClick={onNextBranch}
						>
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
							onClick={() => regenerateAssistantMessage(messageNode.id)}
						>
							<Icon iconId={"refresh-ccw"} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
