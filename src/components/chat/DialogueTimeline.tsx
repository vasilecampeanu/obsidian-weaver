// Third-party modules
import React, { useEffect, useRef } from 'react';

// Interfaces
import { IChatMessage } from 'interfaces/IChats';

// Components
import { MessageBubble } from './MessageBouble';

interface DialogueTimelineProps {
	messages: IChatMessage[] | undefined;
}

export const DialogueTimeline: React.FC<DialogueTimelineProps> = ({ messages }) => {
	const dialogueTimelineRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const messageList = dialogueTimelineRef.current;

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
						creationDate={message.creationDate}
						content={message.content}
						isLoading={message.isLoading}
					/>
				);
			}
		});
	};

	return (
		<div ref={dialogueTimelineRef} className="ow-dialogue-timeline">
			{renderMessageBubbles()}
		</div>
	);
};

export default DialogueTimeline;
