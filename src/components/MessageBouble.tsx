import React from 'react';

export interface MessageBubbleProps {
	role: string; 
	timestamp: string
	content: string; 
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
	role, 
	timestamp,
	content
}) => {
	return (
		<div className={`message-bubble ${role === 'user' ? 'user-message' : 'assistant-message'}`}>
			<div>{content}</div>
			<div className="timestamp">{timestamp}</div>
		</div>
	);
};
