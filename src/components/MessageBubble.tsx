import React from "react";
import { Message } from "interfaces/Conversation";
import BranchSelector from "./BranchSelector";

interface MessageBubbleProps {
    message: Message;
    parentNodeId?: string;
    parentIndex?: number;
    parentChildrenLength?: number;
    handleLeft?: (nodeId: string, currentIndex: number) => void;
    handleRight?: (nodeId: string, currentIndex: number, childrenLength: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, handleLeft, handleRight, parentNodeId, parentIndex, parentChildrenLength 
}) => {
    return (
        <div className={`ow-message-bubble ow-${message.author.role}`}>
            <div className="ow-message-bubble-inner-wrapper">
                <div className="ow-message-info-bar">
                    {parentChildrenLength && parentChildrenLength > 1 ? (
                        <BranchSelector
                            currentIndex={parentIndex!} 
                            totalBranches={parentChildrenLength}
                            onLeft={() => handleLeft!(parentNodeId!, parentIndex!)}
                            onRight={() => handleRight!(parentNodeId!, parentIndex!, parentChildrenLength)}
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
