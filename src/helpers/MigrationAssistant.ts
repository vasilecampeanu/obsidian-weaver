import { FileSystemAdapter, normalizePath } from 'obsidian';
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import { IChatSession } from 'components/chat/ConversationDialogue';
import { FileIOManager } from './FileIOManager';
import fs from 'fs';
import Weaver from 'main';

export class MigrationAssistant {
	// TODO: Handle conersations with the same name
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

			const descriptor = {
				version: '2.0.0',
				threads: oldData.threads.map((thread: any, index: any) => {
					const conversations = thread.conversations.map((conversation: any) => {
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

						// console.log(updatedMessages)

						const updatedConversation = {
							id: conversation.id,
							title: conversation.title,
							path: `${plugin.settings.weaverFolderPath}/threads/base/${conversation.title}.bson`,
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

						this.migrateConversation(plugin, conversation.title, updatedConversation);

						return {
							id: conversation.id,
							title: conversation.title,
							path: `${plugin.settings.weaverFolderPath}/threads/base/${conversation.title}.bson`,
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
					});

					return {
						id: thread.threadId,
						title: thread.threadName,
						conversations: conversations,
					};
				}),
			};

			console.log(descriptor)

			// Save the descriptor
			await FileIOManager.writeDescriptor(plugin, descriptor);

		} catch (error) {
			console.error('Error migrating data:', error);
			throw error;
		}
	}
}
