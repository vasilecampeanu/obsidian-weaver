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
		<div className={`message-bubble ${role === 'user' ? 'message-user' : 'message-assistant'}`}>
			<div className="message-content">{content}</div>
			<div className="timestamp">{timestamp}</div>
		</div>
	);
};
