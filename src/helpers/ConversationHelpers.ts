import { FileSystemAdapter, normalizePath } from 'obsidian';
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import { IChatMessage, IChatSession } from 'components/chat/ConversationDialogue';

import Weaver from 'main';
import { MigrationAssistant } from './MigrationAssistant';
import { FileIOManager } from './FileIOManager';

export class ConversationHelper {
	static async metadataObjectManager(data: any, excludeMessages: boolean): Promise<any> {
		const metadataObject = {
			color: data.color,
			context: data.context,
			creationDate: data.creationDate,
			icon: data.icon,
			id: data.id,
			lastModified: data.lastModified,
			messages: data.messages,
			messagesCount: data.messagesCount,
			model: data.model,
			path: data.path,
			tags: data.tags,
			title: data.title,
			tokens: data.tokens,
		};

		if (excludeMessages) {
			delete metadataObject.messages;
		}
	
		return metadataObject;
	}

	static async syncConversationMetadata(plugin: Weaver, updatedConversation: any, threadId: number): Promise<void> {
		try {
			// Load the descriptor
			const descriptor = await FileIOManager.readDescriptor(plugin);

			// Find the thread and conversation to update
			const threadIndex = descriptor.threads.findIndex((thread: { id: any; }) => thread.id === threadId);
			const conversationIndex = descriptor.threads[threadIndex].conversations.findIndex((conversation: { id: any; }) => conversation.id === updatedConversation.id);

			// Update the conversation metadata in the descriptor using createMetadata function
			const metadata = await this.metadataObjectManager(updatedConversation, true);
			descriptor.threads[threadIndex].conversations[conversationIndex] = {
				...descriptor.threads[threadIndex].conversations[conversationIndex],
				...metadata
			};

			// Save the updated descriptor
			await FileIOManager.writeDescriptor(plugin, descriptor);
		} catch (error) {
			console.error('Error syncing conversation metadata:', error);
			throw error;
		}
	}

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
			// Reads conversation bson
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

	static async createNewConversation(plugin: Weaver, threadId: number, newChatSession: IChatSession): Promise<void> {
		try {
			const descriptor = await FileIOManager.readDescriptor(plugin);
	
			// Find the thread
			const threadIndex = descriptor.threads.findIndex((thread: { id: number; }) => thread.id === threadId);
	
			if (threadIndex === -1) {
				console.error('Thread not found:', threadId);
				throw new Error('Thread not found');
			}
	
			// Add the new conversation metadata to the thread in the descriptor
			const conversationMetadata = await this.metadataObjectManager(newChatSession, true);
			descriptor.threads[threadIndex].conversations.push(conversationMetadata);
	
			// Save the updated descriptor
			await FileIOManager.writeDescriptor(plugin, descriptor);
			await FileIOManager.ensureFolderExists(plugin, `threads/${descriptor.threads[threadIndex].title}`);
	
			// Now we are going to create the bson file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const conversationPath = `${plugin.settings.weaverFolderPath}/threads/${descriptor.threads[threadIndex].title}/${newChatSession.title}.bson`;
	
			const conversationData = await this.metadataObjectManager(newChatSession, false);
	
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
			const descriptor = await FileIOManager.readDescriptor(plugin);
			
			// Find the thread and the conversation to update
			const threadIndex = descriptor.threads.findIndex((thread: { id: any; }) => thread.id === threadId);
			const conversationIndex = descriptor.threads[threadIndex].conversations.findIndex((conversation: { id: any; }) => conversation.id === conversationId);

			// Check for duplicate titles
			const duplicateTitle = descriptor.threads[threadIndex].conversations.some((conversation: { title: string; }) => conversation.title.toLowerCase() === newTitle.toLowerCase());

			if (duplicateTitle) {
				return { success: false, errorMessage: 'A chat with this name already exists!' };
			}

			// Update the title and path in the descriptor
			const oldPath = descriptor.threads[threadIndex].conversations[conversationIndex].path;
			const basePath = oldPath.substring(0, oldPath.lastIndexOf('/'));
			const newPath = `${basePath}/${newTitle}.bson`;

			descriptor.threads[threadIndex].conversations[conversationIndex].title = newTitle;
			descriptor.threads[threadIndex].conversations[conversationIndex].path = newPath;

			await FileIOManager.writeDescriptor(plugin, descriptor);

			// Now we are going to update the metadata inside the bson file
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
			console.log("Hello world!");
			console.error('Error updating conversation title:', error);
			return { success: false, errorMessage: error.message };
		}
	}

	static async deleteConversation(plugin: Weaver, threadId: number, conversationId: number): Promise<void> {
		try {
			const descriptor = await FileIOManager.readDescriptor(plugin);

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
			await FileIOManager.writeDescriptor(plugin, descriptor);

			// Remove conversation bson
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			await adapter.remove(normalizePath(conversationPath));
		} catch (error) {
			console.error('Error deleting conversation:', error);
			throw error;
		}
	}

	static async addNewMessage(plugin: Weaver, threadId: number, conversationId: number, newMessage: IChatMessage): Promise<IChatMessage[]> {
		try {
			// Read the descriptor
			const descriptor = await FileIOManager.readDescriptor(plugin);

			// Find the thread and conversation
			const thread = descriptor.threads.find((thread: { id: number; }) => thread.id === threadId);
			const conversation = thread?.conversations.find((conversation: { id: number; }) => conversation.id === conversationId);

			if (!thread || !conversation) {
				console.error('Thread or conversation not found:', threadId, conversationId);
				throw new Error('Thread or conversation not found');
			}

			// Read the conversation BSON file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const buffer = await adapter.readBinary(conversation.path);
			const bsonData = new Uint8Array(buffer);
			const conversationData = BSON.deserialize(bsonData);

			// Insert the new message
			conversationData.messages.push(newMessage);

			// Update the lastModified field
			conversationData.lastModified = newMessage.creationDate;

			// Serialize and save the updated conversation BSON file
			const updatedBsonData = BSON.serialize(conversationData);
			const updatedBuffer = Buffer.from(updatedBsonData.buffer);

			await adapter.writeBinary(conversation.path, updatedBuffer);

			// Update the conversation metadata in the descriptor
			await this.syncConversationMetadata(plugin, {
				...conversationData,
				messagesCount: conversationData.messages.length
			}, threadId);

			return conversationData.messages;
		} catch (error) {
			console.error('Error inserting a new message:', error);
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
