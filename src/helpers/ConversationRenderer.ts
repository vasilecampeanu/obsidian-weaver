import { IChatMessage, IConversation } from "interfaces/IThread";

export class ConversationRenderer {
	// Initialize selected children object.
	static selectedChildren: { [key: string]: number } = {};

	// Function to find path to current node and populate selectedChildren.
	static findPathToCurrentNode = (conversation: IConversation | undefined, messageId: string, path: string[]): string[] => {
		const message = conversation!.messages.find(msg => msg.id === messageId);

		if (message) {
			if (message.children && message.children.length > 0) {
				for (let i = 0; i < message.children.length; i++) {
					const childId = message.children[i];
					if (childId === conversation!.currentNode || this.findPathToCurrentNode(conversation, childId, [...path, messageId]).length > 0) {
						this.selectedChildren[messageId] = i;
						return [...path, messageId];
					}
				}
			}
		}

		return [];
	}
	
	static deriveRenderedMessages = (conversation: IConversation | undefined, messageId: string): IChatMessage[] => {
		const message: IChatMessage | undefined = conversation!.messages.find((msg) => msg.id === messageId);

		if (!message) return [];

		const childIds = message.children || [];
		const selectedChildIndex = this.selectedChildren[messageId] || 0;

		if (message.role === "system") {
			return childIds[selectedChildIndex] ? this.deriveRenderedMessages(conversation, childIds[selectedChildIndex]) : [];
		}

		return [
			message,
			...(childIds[selectedChildIndex] ? this.deriveRenderedMessages(conversation, childIds[selectedChildIndex]) : [])
		];
	};

	static getRenderedMessages = (conversation: IConversation | undefined): IChatMessage[] => {
		if (!conversation) return [];
		this.findPathToCurrentNode(conversation, conversation.messages.find(msg => msg.role === "system")?.id || '', []);
		const rootMessage = conversation.messages.find((msg) => msg.role === "system");
		return rootMessage ? this.deriveRenderedMessages(conversation, rootMessage.id) : [];
	};
}
