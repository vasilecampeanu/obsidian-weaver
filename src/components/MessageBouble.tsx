import React from 'react';
import ReactMarkdown from 'react-markdown';

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
			<div className="message-content">
				<ReactMarkdown>{content}</ReactMarkdown>
			</div>
		</div>
	);
};
