// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Interfaces
import { IChatMessage, IChatSession } from 'interfaces/IChats';

// Local modules
import { FileIOManager } from './FileIOManager';
import { MigrationAssistant } from './MigrationAssistant';
import { DescriptorManager } from 'utils/DescriptorManager';
import { ConversationBsonManager } from 'utils/ConversationBsonManager';
import { MetadataManager } from 'utils/MetadataManager';

export class ConversationHelper {
	static async getConversations(plugin: Weaver, threadId: number): Promise<IChatSession[]> {
		try {
			if (await FileIOManager.legacyStorageExists(plugin)) {
				const legacyData = await FileIOManager.readLegacyData(plugin);

				if (!legacyData.hasOwnProperty("schemaMigrationStatus") || legacyData.schemaMigrationStatus != true) {
					legacyData.schemaMigrationStatus = true;
					await FileIOManager.writeToLegacyStorage(plugin, legacyData);
					await MigrationAssistant.migrateData(plugin);
				}
			}

			const descriptor = await DescriptorManager.readDescriptor(plugin);
			console.log("Descriptor: ", descriptor);
			const thread = descriptor.threads.find((p: { id: number; }) => p.id === threadId);

			return thread ? thread.conversations : [];
		} catch (error) {
			console.error('Error reading conversations:', error);
			throw error;
		}
	}

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
