import React from "react";
import { Message } from "interfaces/Conversation";

interface Props {
	message: Message;
}

export const MessageComponent: React.FC<Props> = ({ message }) => {
	return (
		<div className={message.author.role}>
			<p>{message.author.name || message.author.role}: {message.content.parts.join(' ')}</p>
		</div>
	)
};

export default MessageComponent;
