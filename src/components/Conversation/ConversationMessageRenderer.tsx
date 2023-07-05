import React from 'react';
import { IChatMessage, IConversation } from 'interfaces/IThread';
import { ConversationMessageBubble } from "./ConversationMessageBubble";
import { ConversationRenderer } from "helpers/ConversationRenderer";
import Weaver from 'main';

interface MessageRendererProps {
	messageId: string;
	previousMessage?: IChatMessage;
	selectedChildren: { [key: string]: number };
	changeSelectedChild: (messageId: string | undefined, increment: number) => Promise<void>;
	conversation?: IConversation;
	plugin: Weaver;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({
	messageId,
	previousMessage,
	selectedChildren,
	changeSelectedChild,
	conversation,
	plugin
}) => {
	const message: IChatMessage | undefined = conversation?.messages.find((msg) => msg.id === messageId);
	const conversationRenderer = new ConversationRenderer(conversation);

	if (!message) {
		return null;
	}

	const childIds = message.children || [];
	const selectedChildIndex = selectedChildren[messageId] || 0;
	const selectedPreviousChildIndex = selectedChildren[previousMessage?.id as string] || 0;

	if (message.author.role === "system") {
		return (
			<MessageRenderer
				messageId={childIds[selectedChildIndex]}
				selectedChildren={selectedChildren}
				changeSelectedChild={changeSelectedChild}
				conversation={conversation}
				plugin={plugin} 
			/>
		)
	}

	const messagesRendered = conversationRenderer.getRenderedMessages();
	const reverseMessages = messagesRendered.reverse();

	const lastUserMessage = reverseMessages.find(message => message.author.role === 'user');
	const lastAssistantMessage = reverseMessages.find(message => message.author.role === 'assistant');

	let contextDisplay = false;

	if (conversation?.context === false && ((message.id === lastUserMessage?.id) || (message.id === lastAssistantMessage?.id))) {
		contextDisplay = true;
	}

	return (
		<>
			<ConversationMessageBubble
				plugin={plugin}
				message={message}
				previousMessage={previousMessage}
				selectedChild={selectedPreviousChildIndex}
				onSelectedChildChange={(increment: number) => changeSelectedChild(previousMessage?.id, increment)}
				contextDisplay={contextDisplay}
				mode={conversation!?.mode}
			/>
			{childIds[selectedChildIndex] && (
				<MessageRenderer
					messageId={childIds[selectedChildIndex]}
					previousMessage={message}
					selectedChildren={selectedChildren}
					changeSelectedChild={changeSelectedChild}
					conversation={conversation}
					plugin={plugin} 
				/>
			)}
		</>
	);
};

export default MessageRenderer;
