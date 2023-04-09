import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBouble';
import { IChatMessage } from './ConversationDialogue';

interface MessageBubbleListProps {
	messages: IChatMessage[] | undefined;
}

export const MessageBubbleList: React.FC<MessageBubbleListProps> = ({ messages }) => {
	const messageBubbleListRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const messageList = messageBubbleListRef.current;

		if (messageList) {
			messageList.scrollTop = messageList.scrollHeight;
		}
	}, [messages?.length]);

	const renderMessageBubbles = () => {
		return messages?.map((message, index) => {
			if (message.role !== 'system') {
				return (
					<MessageBubble
						key={index}
						role={message.role}
						timestamp={message.timestamp}
						content={message.content}
						isLoading={message.isLoading}
					/>
				);
			}
		});
	};

	return (
		<div ref={messageBubbleListRef} className="conversation-history">
			{renderMessageBubbles()}
		</div>
	);
};

export default MessageBubbleList;