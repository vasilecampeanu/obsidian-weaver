// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Local modules
import { FileIOManager } from './FileIOManager';

export class MigrationAssistant {
	static validateTitle(input: string): string {
		const pattern = /[^a-zA-Z0-9\s-_.,!(){}'"+=%@&$*~`?;]/g;
		return input.replace(pattern, '');
	}

	static async migrateConversation(plugin: Weaver, title: string, data: object): Promise<void> {
		try {
			await FileIOManager.ensureFolderExists(plugin, "threads/base");

			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const sanitizedTitle = this.validateTitle(title);
			const conversationPath = `/${plugin.settings.weaverFolderPath}/threads/base/${sanitizedTitle}.bson`;

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

			let descriptor: any = {};
			let descriptorExists = await FileIOManager.descriptorExists(plugin);

			if (descriptorExists) {
				descriptor = await FileIOManager.readDescriptor(plugin);

				const firstThread = descriptor.threads[0];
				const existingTitles = new Set(firstThread.conversations.map((conv: any) => conv.title));

				const conversationsPromises = oldData.threads[0].conversations.map(async (conversation: any) => {
					const updatedMessages = conversation.messages.map((message: any) => {
						message.context = true;
						message.creationDate = message.timestamp;
						message.id = 0;
						message.lastModified = message.timestamp;
						message.model = plugin.settings.engine;
						message.tokens = 0;
						message.type = "message";

						delete message.timestamp;

						return message;
					});

					let sanitizedTitle = this.validateTitle(conversation.title);
					let uniqueTitle = sanitizedTitle;
					let index = 1;

					while (existingTitles.has(uniqueTitle)) {
						const baseTitle = conversation.title;
						uniqueTitle = `${baseTitle} ${index}`;
						index++;
					}

					existingTitles.add(uniqueTitle);

					const updatedConversation = {
						color: "",
						context: true,
						creationDate: conversation.timestamp,
						icon: "",
						id: conversation.id,
						lastModified: conversation.timestamp,
						messages: updatedMessages,
						messagesCount: updatedMessages.length,
						model: plugin.settings.engine,
						path: `${plugin.settings.weaverFolderPath}/threads/base/${uniqueTitle}.bson`,
						tags: [],
						title: uniqueTitle,
						tokens: 0,
					};

					await this.migrateConversation(plugin, uniqueTitle, updatedConversation);

					return {
						color: "",
						context: true,
						creationDate: conversation.timestamp,
						icon: "",
						id: conversation.id,
						lastModified: conversation.timestamp,
						messagesCount: updatedMessages.length,
						model: plugin.settings.engine,
						path: `${plugin.settings.weaverFolderPath}/threads/base/${uniqueTitle}.bson`,
						tags: [],
						title: uniqueTitle,
						tokens: 0,
					};
				});

				const newConversations = await Promise.all(conversationsPromises);
				firstThread.conversations = firstThread.conversations.concat(newConversations);

			} else {
				const threadsPromises = oldData.threads.map(async (thread: any, index: any) => {
					const existingTitles = new Set();

					const conversations = await Promise.all(thread.conversations.map(async (conversation: any) => {
						const updatedMessages = conversation.messages.map((message: any) => {
							message.context = true;
							message.creationDate = message.timestamp;
							message.id = 0;
							message.lastModified = message.timestamp;
							message.model = plugin.settings.engine;
							message.tokens = 0;
							message.type = "message";

							delete message.timestamp;

							return message;
						});

						let sanitizedTitle = this.validateTitle(conversation.title);
						let uniqueTitle = sanitizedTitle;
						let index = 1;

						while (existingTitles.has(uniqueTitle)) {
							const baseTitle = conversation.title;
							uniqueTitle = `${baseTitle} ${index}`;
							index++;
						}

						existingTitles.add(uniqueTitle);

						const updatedConversation = {
							color: "",
							context: true,
							creationDate: conversation.timestamp,
							icon: "",
							id: conversation.id,
							identifier: "obsidian-weaver",
							lastModified: conversation.timestamp,
							messages: updatedMessages,
							messagesCount: updatedMessages.length,
							model: plugin.settings.engine,
							path: `${plugin.settings.weaverFolderPath}/threads/base/${uniqueTitle}.bson`,
							tags: [],
							title: uniqueTitle,
							tokens: 0,
						};

						await this.migrateConversation(plugin, uniqueTitle, updatedConversation);

						return {
							color: "",
							context: true,
							creationDate: conversation.timestamp,
							icon: "",
							id: conversation.id,
							identifier: "obsidian-weaver",
							lastModified: conversation.timestamp,
							messagesCount: updatedMessages.length,
							model: plugin.settings.engine,
							path: `${plugin.settings.weaverFolderPath}/threads/base/${uniqueTitle}.bson`,
							tags: [],
							title: uniqueTitle,
							tokens: 0,
						};
					}));

					return {
						description: "",
						conversations: conversations,
						id: thread.threadId,
						identifier: "obsidian-weaver",
						title: thread.threadName,
					};
				});

				const resolvedThreads = await Promise.all(threadsPromises);

				descriptor = {
					threads: resolvedThreads,
					version: '2.0.0',
				};
			}

			await FileIOManager.writeDescriptor(plugin, descriptor);
		} catch (error) {
			console.error('Error migrating data:', error);
			throw error;
		}
	}
}
