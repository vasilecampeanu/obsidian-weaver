import { FileSystemAdapter, normalizePath } from 'obsidian';
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import { IChatSession } from 'components/chat/ConversationDialogue';
import { FileIOManager } from './FileIOManager';
import fs from 'fs';
import Weaver from 'main';

export class MigrationAssistant {
	static async migrateConversation(plugin: Weaver, title: string, data: object): Promise<void> {
		try {
			await FileIOManager.ensureFolderExists(plugin, "threads/base");

			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const conversationPath = `/${plugin.settings.weaverFolderPath}/threads/base/${title}.bson`;

			const bsonData = BSON.serialize(data);
			const buffer = Buffer.from(bsonData.buffer);

			await adapter.writeBinary(conversationPath, buffer);
		} catch (error) {
			console.error('Error backing up conversations:', error);
			throw error;
		}
	}

	static async migrateData(plugin: Weaver): Promise<void> {
		try {
			await FileIOManager.ensureFolderExists(plugin, "threads/base");

			const oldData = await FileIOManager.readLegacyData(plugin);

			const threadsPromises = oldData.threads.map(async (thread: any, index: any) => {
				const existingTitles = new Set();

				const conversations = await Promise.all(thread.conversations.map(async (conversation: any) => {
					const updatedMessages = conversation.messages.map((message: any) => {
						message.id = 0;
						message.context = true;
						message.tokens = 0;
						message.creationDate = message.timestamp;
						message.lastModified = message.timestamp;
						message.model = plugin.settings.engine;
						message.type = "message";
						delete message.timestamp;
						return message;
					});

					let uniqueTitle = conversation.title;
					let index = 1;

					while (existingTitles.has(uniqueTitle)) {
						const baseTitle = conversation.title;
						uniqueTitle = `${baseTitle} ${index}`;
						index++;
					}

					existingTitles.add(uniqueTitle);

					const updatedConversation = {
						id: conversation.id,
						title: uniqueTitle,
						path: `${plugin.settings.weaverFolderPath}/threads/base/${uniqueTitle}.bson`,
						creationDate: conversation.timestamp,
						lastModified: conversation.timestamp,
						tags: [],
						tokens: 0,
						icon: "",
						color: "",
						context: true,
						model: plugin.settings.engine,
						messagesCount: updatedMessages.length,
						messages: updatedMessages
					};

					await this.migrateConversation(plugin, uniqueTitle, updatedConversation);

					return {
						id: conversation.id,
						title: uniqueTitle,
						path: `${plugin.settings.weaverFolderPath}/threads/base/${uniqueTitle}.bson`,
						creationDate: conversation.timestamp,
						lastModified: conversation.timestamp,
						tags: [],
						tokens: 0,
						icon: "",
						color: "",
						context: true,
						model: plugin.settings.engine,
						messagesCount: updatedMessages.length
					};
				}));

				return {
					id: thread.threadId,
					title: thread.threadName,
					conversations: conversations,
				};
			});

			const resolvedThreads = await Promise.all(threadsPromises);

			const descriptor = {
				version: '2.0.0',
				threads: resolvedThreads,
			};

			// Save the descriptor
			await FileIOManager.writeDescriptor(plugin, descriptor);

		} catch (error) {
			console.error('Error migrating data:', error);
			throw error;
		}
	}
}	
