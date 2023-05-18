import { IConversation } from 'interfaces/IThread';
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

export class ConversationHelper {
	static getRandomWelcomeMessage(): string {
		const welcomeMessages = [
			"Welcome back! What can I assist you with today?",
			"Hello! It's great to see you again. What would you like to chat about?",
			"Good to see you! If you have any questions or need assistance, feel free to ask. I'm here to help you.",
		];

		const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
		return welcomeMessages[randomIndex];
	}
}
