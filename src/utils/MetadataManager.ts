// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Interfaces
import { IChatMessage, IChatSession } from 'interfaces/IChats';

// Local modules
import { FileIOManager } from 'helpers/FileIOManager';
import { FileWizard } from './FileWizard';
import { DescriptorManager } from './DescriptorManager';
import { ConversationBsonManager } from './ConversationBsonManager';

export class MetadataManager {
	static async metadataObjectManager(data: any, excludeMessages: boolean): Promise<any> {
		try {
			const metadataObject: IChatSession = {
				color: data.color,
				context: data.context,
				creationDate: data.creationDate,
				description: data.description,
				icon: data.icon,
				id: data.id,
				identifier: data.identifier,
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
		} catch (error) {
			console.error('Error in metadataObjectManager:', error);
			throw error;
		}
	}

	static async syncConversationMetadata(plugin: Weaver, updatedConversationMetadata: any, threadId: number): Promise<void> {
		try {
			// Load the descriptor
			const descriptor = await DescriptorManager.readDescriptor(plugin);

			// Find the thread and conversation to update
			const thread = descriptor.threads.find((thread: { id: any; }) => thread.id === threadId);
			const conversation = thread.conversations.find((conversation: { id: any; }) => conversation.id === updatedConversationMetadata.id);

			if (!thread || !conversation) {
				console.error(`Thread or conversation not found for threadId: ${threadId}, conversationId: ${updatedConversationMetadata.id}`);
				throw new Error('Thread or conversation not found');
			}

			// Update the conversation metadata in the descriptor using metadataObjectManager function
			const metadata = await this.metadataObjectManager(updatedConversationMetadata, true);
			Object.assign(conversation, metadata);

			// Save the updated descriptor
			await DescriptorManager.writeDescriptor(plugin, descriptor);
		} catch (error) {
			console.error(`Error syncing conversation metadata for threadId: ${threadId}, conversationId: ${updatedConversationMetadata.id}:`, error);
			throw error;
		}
	}

	static async handleAddedBsonFile(plugin: Weaver, file: any, threadTitle: string) {
		// Perform the operation for added BSON files
		console.log("syncDescriptorWithFileSystem: Added BSON file: ", file);
	}

	static async handleDeletedBsonFile(plugin: Weaver, descriptorFile: any) {
		// Perform the operation for deleted BSON files
		console.log("syncDescriptorWithFileSystem: Deleted BSON file: ", descriptorFile);
	}

	static async handleRenamedBsonFile(plugin: Weaver, oldDescriptorFile: any, newBsonFile: any) {
		// Perform the operation for renamed BSON files
		console.log("syncDescriptorWithFileSystem: Renamed BSON file: ", oldDescriptorFile, newBsonFile);
	}

	static async compareAndSyncBsonFiles(plugin: Weaver, bsonFilesList: any, descriptorBsonFiles: any, threadTitle: string) {
		const bsonFileMap = new Map(bsonFilesList.map((file: { name: any; }) => [file.name, file]));
		const descriptorFileMap = new Map(descriptorBsonFiles.map((file: { title: any; }) => [file.title + ".bson", file]));

		// Handle added BSON files
		for (const [name, file] of bsonFileMap.entries()) {
			const fileName = name as string;

			if (!descriptorFileMap.has(fileName)) {
				if (fileName.endsWith('.bson')) {
					await this.handleAddedBsonFile(plugin, file as {name: string, path: string}, threadTitle);
				}
			} else {
				const oldDescriptorFile = descriptorFileMap.get(fileName) as {title: string, path: string};
				const oldPath = plugin.settings.weaverFolderPath + "/" + oldDescriptorFile.path;

				if (oldPath !== (file as {name: string, path: string}).path) {
					await this.handleRenamedBsonFile(plugin, oldDescriptorFile, file as {name: string, path: string});
				}
			}
		}		

		// Handle deleted BSON files
		for (const [title, descriptorFile] of descriptorFileMap.entries()) {
			if (!bsonFileMap.has(title)) {
				await this.handleDeletedBsonFile(plugin, descriptorFile);
			}
		}
	}

	// TODO: https://chat.openai.com/c/a8cb5c7c-9508-449a-b526-bfc241e1f3f1
	static async syncDescriptorWithFileSystem(plugin: Weaver): Promise<void> {
		try {
			// Read the descriptor
			const descriptor = await DescriptorManager.readDescriptor(plugin);

			for (const thread of descriptor.threads) {
				const threadFolderPath = `${plugin.settings.weaverFolderPath}/threads/${thread.title}`;
				const bsonFilesList = await FileWizard.getAllFilesInFolder(plugin, threadFolderPath);

				const descriptorCurrentThread = descriptor.threads.find((p: { id: number; }) => p.id === thread.id);
				const descriptorBsonFiles = descriptorCurrentThread ? descriptorCurrentThread.conversations : [];

				await this.compareAndSyncBsonFiles(plugin, bsonFilesList, descriptorBsonFiles, thread.title);
			}

		} catch (error) {
			console.error('Error syncing descriptor with file system:', error);
			throw error;
		}
	}
}
