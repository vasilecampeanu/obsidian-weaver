// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';
import fs from 'fs';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import { IChatMessage, IConversation } from 'interfaces/IThread';
import { v4 as uuidv4 } from 'uuid';
import { ThreadManager } from './ThreadManager';
import { ConversationManager } from './ConversationManager';
import { FileIOManager } from './FileIOManager';
import { normalize } from 'path';

export class MigrationAssistant {
	static async legacyStorageExists(plugin: Weaver): Promise<boolean> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const filePath = `/${plugin.settings.weaverFolderPath}/conversations.bson`;

			return await adapter.exists(filePath);
		} catch (error) {
			console.error('Error checking legacy storage existence:', error);
			throw error;
		}
	}

	static async readLegacyData(plugin: Weaver) {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;
		const filePath = `/${plugin.settings.weaverFolderPath}/conversations.bson`;
		const arrayBuffer = await adapter.readBinary(filePath);
		const bsonData = new Uint8Array(arrayBuffer);
		const deserializedData = BSON.deserialize(bsonData);

		return deserializedData;
	}
	
	static sanitizeTitle(title: string): string {
		return title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
	}

	static async migrateData(plugin: Weaver): Promise<void> {
		try {
			if (await this.legacyStorageExists(plugin)) {
				const oldData = await this.readLegacyData(plugin);
	
				const adapter = plugin.app.vault.adapter as FileSystemAdapter;
				const titleCache: { [title: string]: number } = {}; // Cache to keep track of duplicate titles
	
				const allConversations = await ThreadManager.getAllConversations(plugin, plugin.settings.weaverFolderPath + '/threads/base');
	
				if (oldData.version !== "1.0.0") {
					return;
				}
	
				// Populate titleCache with existing conversation titles
				allConversations.forEach(conv => {
					if (titleCache[conv.title] === undefined) {
						titleCache[conv.title] = 1;
					} else {
						titleCache[conv.title]++;
					}
				});
	
				const conversationsPromises = oldData.threads[0].conversations.map(async (conversation: any) => {
					let previousMessageId: string = uuidv4();
					let previousMessage: IChatMessage | null = null;
					let nextMessageId: string = "";
	
					const newMessages: IChatMessage[] = conversation.messages.map((message: any, index: number) => {
						const messageId = uuidv4();
						const creationTime = new Date(message.timestamp).toISOString();
	
						let newMessage: IChatMessage = {
							id: messageId,
							parent: previousMessageId,
							children: [],
							message_type: 'chat',
							status: 'sent',
							context: false,
							create_time: creationTime,
							update_time: creationTime,
							author: {
								role: message.role,
								ai_model: plugin.settings.engine,
								mode: 'balanced'
							},
							content: {
								content_type: 'text',
								parts: message.content
							}
						};
	
						if (previousMessage) {
							previousMessage.children.push(messageId);
						}
	
						previousMessageId = messageId;
						previousMessage = newMessage;
						nextMessageId = messageId;
	
						return newMessage;
					});
	
					await FileIOManager.ensureFolderPathExists(plugin, "threads/base");
	
					let baseTitle = this.sanitizeTitle(conversation.title);
					let count = titleCache[baseTitle] || 0;
					let conversationTitle = count > 0 ? `${baseTitle} ${count}` : baseTitle;
	
					// Loop until we find a title that hasn't been used
					while (titleCache[conversationTitle] !== undefined) {
						count++;
						conversationTitle = `${baseTitle} ${count}`;
					}
	
					// Update the count in cache
					titleCache[baseTitle] = count + 1;
	
					const newConversation: IConversation = {
						currentNode: nextMessageId,
						context: true,
						creationDate: conversation.timestamp,
						id: uuidv4(),
						identifier: "obsidian-weaver",
						lastModified: conversation.timestamp,
						title: conversationTitle,
						messages: newMessages,
						model: plugin.settings.engine,
						mode: "balanced"
					};
	
					let conversationPath = normalizePath(`${plugin.settings.weaverFolderPath}/threads/base/${conversationTitle}.json`);
					await adapter.write(conversationPath, JSON.stringify(newConversation, null, 4));
	
					// Return the new conversation
					return newConversation;
				});
	
				// Wait for all conversations to be migrated
				await Promise.all(conversationsPromises);
				await FileIOManager.ensureFolderPathExists(plugin, "backups");
	
				await adapter.rename(
					normalize(`/${plugin.settings.weaverFolderPath}/conversations.bson`),
					normalize(`/${plugin.settings.weaverFolderPath}/backups/conversations-${Date.now()}.bson`)
				);
			}
		} catch (error) {
			console.error('Error migrating data:', error);
			throw error;
		}
	}	
}
