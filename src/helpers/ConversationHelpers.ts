import { FileSystemAdapter, normalizePath } from 'obsidian';
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import { IChatSession } from 'components/chat/ConversationDialogue';

import fs from 'fs';
import Weaver from 'main';
import { MigrationAssistant } from './MigrationAssistant';
import { FileIOManager } from './FileIOManager';

export class ConversationHelper {
	static async syncConversationMetadata(plugin: Weaver, updatedConversation: any, threadId: number): Promise<void> {
		try {
			// Load the descriptor
			const descriptor = await FileIOManager.readDescriptor(plugin);

			// Find the thread and conversation to update
			const threadIndex = descriptor.threads.findIndex((thread: { id: any; }) => thread.id === threadId);
			const conversationIndex = descriptor.threads[threadIndex].conversations.findIndex((conversation: { id: any; }) => conversation.id === updatedConversation.id);

			// Update the conversation metadata in the descriptor
			descriptor.threads[threadIndex].conversations[conversationIndex] = {
				...descriptor.threads[threadIndex].conversations[conversationIndex],
				title: updatedConversation.title,
				creationDate: updatedConversation.creationDate,
				lastModified: updatedConversation.lastModified,
				tags: updatedConversation.tags,
				tokens: updatedConversation.tokens,
				icon: updatedConversation.icon,
				color: updatedConversation.color,
				context: updatedConversation.context,
				model: updatedConversation.model,
				messagesCount: updatedConversation.messagesCount
			};

			// Save the updated descriptor
			await FileIOManager.writeDescriptor(plugin, descriptor);
		} catch (error) {
			console.error('Error syncing conversation metadata:', error);
			throw error;
		}
	}

	static async readConversations(plugin: Weaver, threadId: number): Promise<IChatSession[]> {
		try {
			const legacyData = await FileIOManager.readLegacyData(plugin);

			if (!legacyData.hasOwnProperty("schemaMigrationStatus") || legacyData.schemaMigrationStatus != true) {
				console.log(legacyData);

				legacyData.schemaMigrationStatus = true;

				await FileIOManager.writeToLegacyStorage(plugin, legacyData);
				await MigrationAssistant.migrateData(plugin);
			}

			const descriptor = await FileIOManager.readDescriptor(plugin);
			const thread = descriptor.threads.find((p: { id: number; }) => p.id === threadId);

			return thread ? thread.conversations : [];
		} catch (error) {
			console.error('Error reading conversations:', error);
			throw error;
		}
	}

	static async readConversationByFilePath(plugin: Weaver, filePath: string): Promise<any> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const arrayBuffer = await adapter.readBinary(filePath);
			const bsonData = new Uint8Array(arrayBuffer);
			const deserializedData = BSON.deserialize(bsonData);
			
			// Return the deserialized conversation data
			return deserializedData;
		} catch (error) {
			console.error('Error reading conversation by file path:', error);
			throw error;
		}
	}

	static async writeConversations(plugin: Weaver, threadId: number, conversations: IChatSession[]): Promise<void> {
		try {
			for (const conversation of conversations) {
				await this.syncConversationMetadata(plugin, conversation, threadId);
			}
		} catch (error) {
			console.error('Error writing conversations:', error);
			throw error;
		}
	}

	static async createNewConversation(plugin: Weaver, threadId: number, newChatSession: IChatSession): Promise<void> {
		try {
			// Read the descriptor
			const descriptor = await FileIOManager.readDescriptor(plugin);

			console.log("createNewConversation, descriptor 01:", descriptor);

			// Find the thread
			const threadIndex = descriptor.threads.findIndex((thread: { id: number; }) => thread.id === threadId);

			if (threadIndex === -1) {
				console.error('Thread not found:', threadId);
				throw new Error('Thread not found');
			}

			// Add the new conversation metadata to the thread in the descriptor
			descriptor.threads[threadIndex].conversations.push({
				id: newChatSession.id,
				title: newChatSession.title,
				path: `${plugin.settings.weaverFolderPath}/threads/${descriptor.threads[threadIndex].title}/${newChatSession.title}.bson`,
				creationDate: newChatSession.creationDate,
				lastModified: newChatSession.creationDate,
				tags: [],
				tokens: 0,
				icon: "",
				color: "",
				context: true,
				model: plugin.settings.engine,
			});

			console.log("createNewConversation, descriptor 02:", descriptor);

			// Save the updated descriptor
			await FileIOManager.writeDescriptor(plugin, descriptor);

			// Save the new conversation BSON file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const conversationPath = `${plugin.settings.weaverFolderPath}/threads/${descriptor.threads[threadIndex].title}/${newChatSession.title}.bson`;

			// Create a new object containing all the properties you want to store
			const conversationData = {
				id: newChatSession.id,
				title: newChatSession.title,
				path: `${plugin.settings.weaverFolderPath}/threads/${descriptor.threads[threadIndex].title}/${newChatSession.title}.bson`,
				creationDate: newChatSession.creationDate,
				lastModified: newChatSession.creationDate,
				tags: [],
				tokens: 0,
				icon: "",
				color: "",
				context: true,
				model: plugin.settings.engine,
				messages: newChatSession.messages
			};

			const bsonData = BSON.serialize(conversationData);
			const buffer = Buffer.from(bsonData.buffer);

			await adapter.writeBinary(conversationPath, buffer);
			
		} catch (error) {
			console.error('Error creating a new conversation:', error);
			throw error;
		}
	}

	static async updateConversationTitle(plugin: Weaver, threadId: number, conversationId: number, newTitle: string): Promise<{ success: boolean; errorMessage?: string }> {
		try {
			// Read the descriptor
			const descriptor = await FileIOManager.readDescriptor(plugin);

			// Find the thread and conversation to update
			const threadIndex = descriptor.threads.findIndex((thread: { id: any; }) => thread.id === threadId);
			const conversationIndex = descriptor.threads[threadIndex].conversations.findIndex((conversation: { id: any; }) => conversation.id === conversationId);

			// Check for duplicate titles
			const duplicateTitle = descriptor.threads[threadIndex].conversations.some((conversation: { title: string; }) => conversation.title === newTitle);

			if (duplicateTitle) {
				return { success: false, errorMessage: 'The provided title already exists. Please choose a different title.' };
			}
	
			// Update the title and path in the descriptor
			const oldPath = descriptor.threads[threadIndex].conversations[conversationIndex].path;
			const basePath = oldPath.substring(0, oldPath.lastIndexOf('/'));
			const newPath = `${basePath}/${newTitle}.bson`;
	
			descriptor.threads[threadIndex].conversations[conversationIndex].title = newTitle;
			descriptor.threads[threadIndex].conversations[conversationIndex].path = newPath;
	
			// Save the updated descriptor
			await FileIOManager.writeDescriptor(plugin, descriptor);
	
			// Read the BSON file
			const bsonData = await this.readConversationByFilePath(plugin, oldPath);
	
			// Update the title and path in the BSON file
			bsonData.title = newTitle;
			bsonData.path = newPath;
	
			// Serialize the BSON data
			const buffer = Buffer.from(BSON.serialize(bsonData).buffer);
	
			// Rename the BSON file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			await adapter.rename(oldPath, newPath);
	
			// Write the updated BSON data to the renamed file
			await adapter.writeBinary(newPath, buffer);

			return { success: true };
		} catch (error) {
			console.error('Error updating conversation title:', error);
			return { success: false, errorMessage: error.message };
		}
	}	

	// ...

	static async deleteConversation(plugin: Weaver, threadId: number, conversationId: number): Promise<void> {
		const conversations = await this.readConversations(plugin, threadId);
		const updatedConversations = conversations.filter((conversation) => conversation.id !== conversationId);
		await this.writeConversations(plugin, threadId, updatedConversations);
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
