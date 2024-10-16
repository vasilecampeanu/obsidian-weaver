import { Icon } from "components/primitives/Icon";
import { useConversation } from "hooks/useConversation";
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
	const { regenerateAssistantMessage } = useConversation();
	const message = messageNode.message;

	if (!message) return null;

	return (
		<div className={`ow-chat-message-bubble ${message.author.role}`}>
			<div className="message-content">
				{message.content.parts.join("\n")}
			</div>
			<div className="ow-message-utility-bar">
				{hasBranches && (
					<div className="branch-navigation">
						<button onClick={onPrevBranch}>
							<Icon iconId={"chevron-left"} />
						</button>
						<span>
							{currentBranchIndex + 1} / {totalBranches}
						</span>
						<button onClick={onNextBranch}>
							<Icon iconId={"chevron-right"} />
						</button>
					</div>
				)}
				{message.author.role === "assistant" && (
					<>
						<button><Icon iconId={"copy"} /></button>
						<button
							onClick={() => regenerateAssistantMessage(messageNode.id)}
						>
							<Icon iconId={"refresh-ccw"} />
						</button>
					</>
				)}
			</div>
		</div>
	);
};
