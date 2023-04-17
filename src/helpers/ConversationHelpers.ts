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

	static async updateConversationDescription(plugin: Weaver, threadId: number, conversationId: number, newDescription: string): Promise<{ success: boolean; errorMessage?: string }> {
		try {
			const descriptor = await DescriptorManager.readDescriptor(plugin);

			// Find the thread and the conversation to update
			const threadIndex = descriptor.threads.findIndex((thread: { id: any; }) => thread.id === threadId);

			if (threadIndex === -1) {
				console.error('Thread not found:', threadId);
				return { success: false, errorMessage: 'Thread not found' };
			}

			const conversationIndex = descriptor.threads[threadIndex].conversations.findIndex((conversation: { id: any; }) => conversation.id === conversationId);

			if (conversationIndex === -1) {
				console.error('Conversation not found:', conversationId);
				return { success: false, errorMessage: 'Conversation not found' };
			}

			descriptor.threads[threadIndex].conversations[conversationIndex].description = newDescription;

			// Update descriptor
			await DescriptorManager.writeDescriptor(plugin, descriptor);

			// Conversation path
			const path = descriptor.threads[threadIndex].conversations[conversationIndex].path;

			// Now we are going to update the metadata inside the bson file
			// Read the BSON file
			const bsonData = await ConversationBsonManager.readConversationByFilePath(plugin, path);

			// Update the title and path in the BSON file
			bsonData.description = newDescription;

			// Serialize the BSON data
			const buffer = Buffer.from(BSON.serialize(bsonData).buffer);

			// Update description in bson file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			await adapter.writeBinary(path, buffer);

			return { success: true };
		} catch (error) {
			console.error('Error updating conversation title:', error);
			return { success: false, errorMessage: error.message };
		}
	}

	static async deleteConversation(plugin: Weaver, threadId: number, conversationId: number): Promise<void> {
		try {
			const descriptor = await DescriptorManager.readDescriptor(plugin);

			// Find the thread
			const threadIndex = descriptor.threads.findIndex((thread: { id: number; }) => thread.id === threadId);

			if (threadIndex === -1) {
				console.error('Thread not found:', threadId);
				throw new Error('Thread not found');
			}

			// Find conversation index 
			const conversationIndex = descriptor.threads[threadIndex].conversations.findIndex((conversation: { id: number; }) => conversation.id === conversationId);

			if (conversationIndex === -1) {
				console.error('Conversation not found:', conversationId);
				throw new Error('Conversation not found');
			}

			// Store conversation path
			const conversationPath = descriptor.threads[threadIndex].conversations[conversationIndex].path;

			// Remove from descriptor
			descriptor.threads[threadIndex].conversations.splice(conversationIndex, 1);
			await DescriptorManager.writeDescriptor(plugin, descriptor);

			// Remove conversation bson
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			await adapter.remove(normalizePath(conversationPath));
		} catch (error) {
			console.error('Error deleting conversation:', error);
			throw error;
		}
	}

	static async deleteConversationByFilePath(plugin: Weaver, filePath: string): Promise<void> {
		try {
			// Read the descriptor
			const descriptor = await DescriptorManager.readDescriptor(plugin);

			// Find the thread and conversation index
			let threadIndex = -1;
			let conversationIndex = -1;

			for (let i = 0; i < descriptor.threads.length; i++) {
				conversationIndex = descriptor.threads[i].conversations.findIndex((conversation: { path: string; }) => conversation.path === filePath);
				if (conversationIndex !== -1) {
					threadIndex = i;
					break;
				}
			}

			if (threadIndex === -1 || conversationIndex === -1) {
				console.error('Thread or conversation not found:', filePath);
				throw new Error('Thread or conversation not found');
			}

			// Remove from descriptor
			descriptor.threads[threadIndex].conversations.splice(conversationIndex, 1);
			await DescriptorManager.writeDescriptor(plugin, descriptor);
		} catch (error) {
			console.error('Error deleting conversation by file path:', error);
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
