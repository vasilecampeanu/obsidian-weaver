// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Interfaces
import { IChatMessage, IChatSession, IChatThread } from 'interfaces/IChats';

// Local modules
import { FileIOManager } from './FileIOManager';
import { MigrationAssistant } from './MigrationAssistant';
import { DescriptorManager } from 'utils/DescriptorManager';
import { ConversationBsonManager } from 'utils/ConversationBsonManager';
import { MetadataManager } from 'utils/MetadataManager';
import { FileWizard } from 'utils/FileWizard';

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
