import Weaver from "main";
import { IChatMessage, IConversation } from "interfaces/IThread";
import { ConversationManager } from "utils/ConversationManager";
import { useState } from "react";

export const useChat = (plugin: Weaver, conversation: IConversation) => {
	const [conversationSession, setConversationSession] = useState<IConversation>(conversation);

	const updateConversation = async (newMessage: IChatMessage) => {
		if (!conversationSession) {
			throw new Error('Chat session is not initialized.');
		}

		const updatedMessages = await ConversationManager.addMessageToConversation(plugin, conversationSession.id, newMessage);

		setConversationSession(prevState => ({
			...prevState,
			currentNode: newMessage.id,
			messages: updatedMessages
		}));
	};

	const findMessageById = (conversation: IConversation, messageId: string): IChatMessage | undefined => {
		return conversation.messages.find(msg => msg.id === messageId);
	};	

	const getRenderedMessages = (conversation: IConversation | null | undefined): IChatMessage[] => {
		if (!conversation) {
			return [];
		}

		const selectedChildren: { [key: string]: number } = {};

		const findPathToCurrentNode = (messageId: string, path: string[]): string[] => {
			const message = findMessageById(conversation, messageId);

			if (!message) {
				throw new Error(`Message with ID ${messageId} does not exist.`);
			}

			if (message.children && message.children.length > 0) {
				for (let i = 0; i < message.children.length; i++) {
					const childId = message.children[i];

					if (childId === conversation.currentNode || findPathToCurrentNode(childId, [...path, messageId]).length > 0) {
						selectedChildren[messageId] = i;
						return [...path, messageId];
					}
				}
			}

			return [];
		}

		findPathToCurrentNode(conversation.messages.find(msg => msg.role === "system")?.id || '', []);

		const deriveRenderedMessages = (messageId: string): IChatMessage[] => {
			const message: IChatMessage | undefined = findMessageById(conversation, messageId);

			if (!message) {
				return [];
			}

			const childIds = message.children || [];
			const selectedChildIndex = selectedChildren[messageId] || 0;

			return [
				message,
				...(childIds[selectedChildIndex] ? deriveRenderedMessages(childIds[selectedChildIndex]) : [])
			];
		};

		const rootMessage = conversation.messages.find((msg) => msg.role === "system");

		return rootMessage ? deriveRenderedMessages(rootMessage.id) : [];
	};

	return { conversationSession, updateConversation, getRenderedMessages };
}
