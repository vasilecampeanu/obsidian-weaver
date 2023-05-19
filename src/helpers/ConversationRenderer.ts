import { IChatMessage, IConversation } from "interfaces/IThread";

export class ConversationRenderer {
	// Stores the index of each selected child message by their parent's message id.
	private selectedChildren: { [key: string]: number } = {};

	constructor(private conversation?: IConversation) {
		if (!conversation) {
			throw new Error('Conversation cannot be undefined');
		}
	}

	private populateSelectedChildrenWithPathToNode(messageId: string, path: string[] = []): string[] {
		const message = this.conversation!.messages.find(msg => msg.id === messageId);

		if (!message) {
			return [];
		}

		if (message.children && message.children.length > 0) {
			for (let i = 0; i < message.children.length; i++) {
				const childId = message.children[i];
				if (childId === this.conversation!.currentNode || this.populateSelectedChildrenWithPathToNode(childId, [...path, messageId]).length > 0) {
					this.selectedChildren[messageId] = i;
					return [...path, messageId];
				}
			}
		}

		return [];
	}

	private deriveRenderedMessages(messageId: string): IChatMessage[] {
		const message = this.conversation!.messages.find((msg) => msg.id === messageId);

		if (!message) {
			return [];
		}

		const childIds = message.children || [];
		const selectedChildIndex = this.selectedChildren[messageId] || 0;
		const nextMessage = childIds[selectedChildIndex] ? this.deriveRenderedMessages(childIds[selectedChildIndex]) : [];

		return message.role === "system" ? nextMessage : [message, ...nextMessage];
	}

	public getRenderedMessages(): IChatMessage[] {
		const rootMessage = this.conversation!.messages.find((msg) => msg.role === "system");

		if (!rootMessage) {
			return [];
		}

		this.populateSelectedChildrenWithPathToNode(rootMessage.id);
		return this.deriveRenderedMessages(rootMessage.id);
	}
}