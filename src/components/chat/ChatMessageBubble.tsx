import { IMessageNode } from "interfaces/IConversation";
import React from "react";

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
	const message = messageNode.message;

	if (!message) return null;

	return (
		<div className={`ow-chat-message-bubble ${message.author.role}`}>
			<div className="message-content">
				{message.content.parts.join("\n")}
			</div>
			{hasBranches && (
				<div className="branch-navigation">
					<button onClick={onPrevBranch}>&lt;</button>
					<span>
						{currentBranchIndex + 1} / {totalBranches}
					</span>
					<button onClick={onNextBranch}>&gt;</button>
				</div>
			)}
		</div>
	);
};
