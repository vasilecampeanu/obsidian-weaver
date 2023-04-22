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

    static async deleteThreadById(plugin: Weaver, threadId: number): Promise<void> {
        try {
            // Read the descriptor
            const descriptor = await DescriptorManager.readDescriptor(plugin);

            // Find the index of the thread with the given ID
            const threadIndex = descriptor.threads.findIndex((thread: IChatThread) => thread.id === threadId);

            // Throw an error if the thread does not exist
            if (threadIndex === -1) {
                console.error('Thread not found:', threadId);
                throw new Error(`Thread with ID: ${threadId} not found!`);
            }

            // Get the thread title to remove its folder later
            const threadTitle = descriptor.threads[threadIndex].title;

            // Remove the thread from the descriptor
            descriptor.threads.splice(threadIndex, 1);

			console.log(descriptor)

            // Save the updated descriptor
            await DescriptorManager.writeDescriptor(plugin, descriptor);

            // Remove the thread folder
            const adapter = plugin.app.vault.adapter as FileSystemAdapter;
            const threadFolderPath = `${plugin.settings.weaverFolderPath}/threads/${threadTitle}`;
			console.log(threadFolderPath)
			adapter.rmdir(threadFolderPath, true);
			// await this.deleteFolderRecursive(plugin, threadFolderPath);

        } catch (error) {
            console.error('Error deleting thread by ID:', error);
            throw error;
        }
    }

    static async updateThreadTitle(
        plugin: Weaver,
        threadId: number,
        newTitle: string
    ): Promise<{ success: boolean; errorMessage?: string }> {
        try {
            // Find the thread to update
            const descriptor = await DescriptorManager.readDescriptor(plugin);
            const thread = descriptor.threads.find((thread: { id: any; }) => thread.id === threadId);

            // Check for duplicate titles
            const duplicateTitle = descriptor.threads.some((thread: { title: string; }) => thread.title.toLowerCase() === newTitle.toLowerCase());

            if (duplicateTitle) {
                return { success: false, errorMessage: 'A thread with this name already exists!' };
            }

            // Update the title in the descriptor
            const oldTitle = thread.title;
            thread.title = newTitle;

            await DescriptorManager.writeDescriptor(plugin, descriptor);

            // Rename the thread folder
            const adapter = plugin.app.vault.adapter as FileSystemAdapter;
            const oldFolderPath = `${plugin.settings.weaverFolderPath}/threads/${oldTitle}`;
            const newFolderPath = `${plugin.settings.weaverFolderPath}/threads/${newTitle}`;

            await adapter.rename(oldFolderPath, newFolderPath);

            return { success: true };
        } catch (error) {
            console.error('Error updating thread title:', error);
            return { success: false, errorMessage: error.message };
        }
    }
}
