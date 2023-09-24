import React from "react";
import { Message } from "interfaces/Conversation";
import BranchSelector from "./BranchSelector";

interface MessageBubbleProps {
    message: Message;
    childrenLength?: number;
    currentIndex?: number;
    handleLeft?: (nodeId: string, currentIndex: number) => void;
    handleRight?: (nodeId: string, currentIndex: number, childrenLength: number) => void;
    nodeId?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, childrenLength, currentIndex, handleLeft, handleRight, nodeId 
}) => {
    return (
        <div className={`ow-message-bubble ow-${message.author.role}`}>
			<div className="ow-message-bubble-inner-wrapper">
				<div className="ow-message-info-bar">
					{childrenLength && childrenLength > 1 ? (
						<BranchSelector
							currentIndex={currentIndex!}
							totalBranches={childrenLength}
							onLeft={() => handleLeft!(nodeId!, currentIndex!)}
							onRight={() => handleRight!(nodeId!, currentIndex!, childrenLength)}
						/>
					) : null}
				</div>
				<div className="ow-message-content">
					{message.author.name || message.author.role}: {message.content.parts.join(' ')}
				</div>
			</div>
        </div>
    );
};
