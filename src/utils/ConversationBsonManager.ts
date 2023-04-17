// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Interfaces
import { IChatMessage, IChatSession } from 'interfaces/IChats';

// Local modules
import { FileWizard } from './FileWizard';
import { MetadataManager } from './MetadataManager';
import { DescriptorManager } from './DescriptorManager';

export class ConversationBsonManager {
	static async createNewConversation(plugin: Weaver, threadId: number, newChatSession: IChatSession): Promise<void> {
		try {
			// Find the thread with the given ID
			const descriptor = await DescriptorManager.readDescriptor(plugin);
			const thread = descriptor.threads.find((thread: { id: number; }) => thread.id === threadId);

			// Throw an error if the thread doesn't exist
			if (!thread) {
				console.error('Thread not found:', threadId);
				throw new Error(`Thread: ${thread} not found!`);
			}

			// Add the new conversation metadata to the thread in the descriptor
			const conversationMetadata = await MetadataManager.metadataObjectManager(newChatSession, true);
			thread.conversations.push(conversationMetadata);

			// Save the updated descriptor
			await DescriptorManager.writeDescriptor(plugin, descriptor);
			await FileWizard.ensureFolderExists(plugin, `threads/${thread.title}`);

			// Create the path for the bson file that will hold the conversation data
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const conversationPath = `${plugin.settings.weaverFolderPath}/threads/${thread.title}/${newChatSession.title}.bson`;

			// Serialize the conversation data into a BSON buffer
			const conversationData = await MetadataManager.metadataObjectManager(newChatSession, false);
			const bsonData = BSON.serialize(conversationData);
			const buffer = Buffer.from(bsonData.buffer);

			// Write the BSON buffer to the file
			await adapter.writeBinary(conversationPath, buffer);
		} catch (error) {
			console.error('Error creating a new conversation:', error);
			throw error;
		}
	}

	static async readConversationByFilePath(plugin: Weaver, filePath: string): Promise<any> {
		try {
			// Read conversation BSON file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const fullPath = `${plugin.settings.weaverFolderPath}/${filePath}`;
			const arrayBuffer = await adapter.readBinary(fullPath);

			// Deserialize BSON data
			const bsonData = new Uint8Array(arrayBuffer);
			const deserializedData = BSON.deserialize(bsonData);

			// Check if the file is supported by the plugin
			if (FileWizard.isSupportedFile(deserializedData)) {
				throw `Unsupported file: ${filePath}. The file must have the "obsidian-weaver" identifier.`;
			}

			// Return the deserialized conversation data
			return deserializedData;
		} catch (error) {
			console.error('Error reading conversation by file path:', filePath, error);
			throw error;
		}
	}

	static async addNewMessage (
		plugin: Weaver, 
		threadId: number, 
		conversationId: number, 
		newMessage: IChatMessage
	): Promise<IChatMessage[]> {
		try {
			// Find the thread and conversation
			const descriptor = await DescriptorManager.readDescriptor(plugin);
			const thread = descriptor.threads.find((thread: { id: number; }) => thread.id === threadId);

			const conversation = thread?.conversations.find((conversation: { id: number; }) => conversation.id === conversationId);

			if (!thread || !conversation) {
				console.error('Thread or conversation not found:', threadId, conversationId);
				throw new Error('Thread or conversation not found');
			}

			// Read the conversation BSON file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const buffer = await adapter.readBinary(`${plugin.settings.weaverFolderPath}/${conversation.path}`);
			const bsonData = new Uint8Array(buffer);
			const conversationData = BSON.deserialize(bsonData);

			// Insert the new message
			conversationData.messages.push(newMessage);

			// Update the lastModified field
			conversationData.lastModified = newMessage.creationDate;

			// Serialize and save the updated conversation BSON file
			const updatedBsonData = BSON.serialize(conversationData);
			const updatedBuffer = Buffer.from(updatedBsonData.buffer);

			await adapter.writeBinary(`${plugin.settings.weaverFolderPath}/${conversation.path}`, updatedBuffer);

			// Update the conversation metadata in the descriptor
			await MetadataManager.syncConversationMetadata(plugin, {
				...conversationData,
				messagesCount: conversationData.messages.length
			}, threadId);

			return conversationData.messages;
		} catch (error) {
			console.error('Error inserting a new message:', error);
			throw error;
		}
	}

	static async updateConversationTitle(
		plugin: Weaver,
		threadId: number,
		conversationId: number,
		newTitle: string
	): Promise<{ success: boolean; errorMessage?: string }> {
		try {
			// Find the thread and the conversation to update
			const descriptor = await DescriptorManager.readDescriptor(plugin);
			const thread = descriptor.threads.find((thread: { id: any; }) => thread.id === threadId);
			const conversation = thread.conversations.find((conversation: { id: any; }) => conversation.id === conversationId);
	
			// Check for duplicate titles
			const duplicateTitle = thread.conversations.some((conversation: { title: string; }) => conversation.title.toLowerCase() === newTitle.toLowerCase());
	
			if (duplicateTitle) {
				return { success: false, errorMessage: 'A chat with this name already exists!' };
			}
	
			// Update the title and path in the descriptor
			const oldPath = conversation.path;
			const basePath = oldPath.substring(0, oldPath.lastIndexOf('/'));
			const newPath = `${basePath}/${newTitle}.bson`;
	
			conversation.title = newTitle;
			conversation.path = newPath;
	
			await DescriptorManager.writeDescriptor(plugin, descriptor);
	
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

			plugin.isRenamingFromInside = true;
			
			await adapter.rename(plugin.settings.weaverFolderPath + "/" + oldPath, plugin.settings.weaverFolderPath + "/" + newPath);
			
			plugin.isRenamingFromInside = false;
	
			// Write the updated BSON data to the renamed file
			await adapter.writeBinary(plugin.settings.weaverFolderPath + "/" + newPath, buffer);
	
			return { success: true };
		} catch (error) {
			console.error('Error updating conversation title:', error);
			return { success: false, errorMessage: error.message };
		}
	}

	static async renameConversationByFilePath(plugin: Weaver, newFilePath: string): Promise<{ success: boolean; errorMessage?: string }> {
		try {
			// Read the BSON file using the new file path
			const bsonData = await ConversationBsonManager.readConversationByFilePath(plugin, newFilePath);
	
			// Get the old file path from the BSON file
			const oldFilePath = bsonData.path;
	
			// Get descriptor data
			const descriptor = await DescriptorManager.readDescriptor(plugin);
	
			// Extract the new title from the new file path
			const newTitle = newFilePath.substring(newFilePath.lastIndexOf('/') + 1, newFilePath.lastIndexOf('.bson'));
	
			// Find the thread and conversation by old file path
			let threadIndex, conversationIndex;
			outerLoop: for (let i = 0; i < descriptor.threads.length; i++) {
				for (let j = 0; j < descriptor.threads[i].conversations.length; j++) {
					if (descriptor.threads[i].conversations[j].path === oldFilePath) {
						threadIndex = i;
						conversationIndex = j;
						break outerLoop;
					}
				}
			}
	
			if (threadIndex === undefined || conversationIndex === undefined) {
				throw new Error("Conversation with the old file path not found.");
			}
	
			// Update the title and path in the descriptor
			descriptor.threads[threadIndex].conversations[conversationIndex].title = newTitle;
			descriptor.threads[threadIndex].conversations[conversationIndex].path = newFilePath;
	
			await DescriptorManager.writeDescriptor(plugin, descriptor);
	
			// Update the title and path in the BSON file
			bsonData.title = newTitle;
			bsonData.path = newFilePath;
	
			// Serialize the BSON data
			const buffer = Buffer.from(BSON.serialize(bsonData).buffer);
	
			// Write the updated BSON data to the renamed file
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			await adapter.writeBinary(plugin.settings.weaverFolderPath + "/" + newFilePath, buffer);
	
			return { success: true };
		} catch (error) {
			console.error('Error renaming conversation by file path:', error);
			return { success: false, errorMessage: error.message };
		}
	}

	static async deleteConversation(plugin: Weaver, threadId: number, conversationId: number): Promise<void> {
		try {
			// Find the thread
			const descriptor = await DescriptorManager.readDescriptor(plugin);
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
			const conversationPath = plugin.settings.weaverFolderPath + "/" + descriptor.threads[threadIndex].conversations[conversationIndex].path;

			// Remove from descriptor
			descriptor.threads[threadIndex].conversations.splice(conversationIndex, 1);
			await DescriptorManager.writeDescriptor(plugin, descriptor);

			// Remove conversation bson
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;

			plugin.isRenamingFromInside = true;
			await adapter.remove(conversationPath);
			plugin.isRenamingFromInside = false;
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
			const path = plugin.settings.weaverFolderPath + "/" + descriptor.threads[threadIndex].conversations[conversationIndex].path;

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
}
