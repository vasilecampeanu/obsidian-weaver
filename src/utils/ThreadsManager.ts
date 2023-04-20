// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Interfaces
import { IChatMessage, IChatSession, IChatThread } from 'interfaces/IChats';

// Local modules
import { DescriptorManager } from 'utils/DescriptorManager';
import { ConversationBsonManager } from 'utils/ConversationBsonManager';
import { MetadataManager } from 'utils/MetadataManager';
import { FileWizard } from 'utils/FileWizard';
import { FileIOManager } from 'helpers/FileIOManager';
import { MigrationAssistant } from 'helpers/MigrationAssistant';

export class ThreadsManager {
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
			const thread = descriptor.threads.find((p: { id: number; }) => p.id === threadId);

			return thread ? thread.conversations : [];
		} catch (error) {
			console.error('Error reading conversations:', error);
			throw error;
		}
	}

	static async getThreads(plugin: Weaver): Promise<IChatThread[]> {
		try {
			const descriptor = await DescriptorManager.readDescriptor(plugin);
			return descriptor.threads || [];
		} catch (error) {
			console.error('Error reading conversations:', error);
			throw error;
		}
	}

	static async addNewThread(plugin: Weaver, newThread: IChatThread): Promise<void> {
		try {
			// Read the descriptor
			const descriptor = await DescriptorManager.readDescriptor(plugin);

			// Check if the thread already exists
			const existingThread = descriptor.threads.find((thread: IChatThread) => thread.id === newThread.id);

			// Throw an error if the thread already exists
			if (existingThread) {
				console.error('Thread already exists:', newThread.id);
				throw new Error(`Thread with ID: ${newThread.id} already exists!`);
			}

			// Add the new thread to the descriptor
			descriptor.threads.push(newThread);

			// Save the updated descriptor
			await DescriptorManager.writeDescriptor(plugin, descriptor);
			await FileWizard.ensureFolderExists(plugin, `threads/${newThread.title}`);

			// Create the thread folder
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const threadFolderPath = `${plugin.settings.weaverFolderPath}/threads/${newThread.title}`;
			await adapter.mkdir(threadFolderPath);

		} catch (error) {
			console.error('Error adding a new thread:', error);
			throw error;
		}
	}
}
