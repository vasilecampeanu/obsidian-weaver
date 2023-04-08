import { FileSystemAdapter, normalizePath } from 'obsidian';
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import { IChatSession } from 'components/chat/ConversationDialogue';

import fs from 'fs';
import Weaver from 'main';

export class ConversationHelper {
	static async storageDirExists(plugin: Weaver): Promise<boolean> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const normalizedPath = adapter.getBasePath() + '/bins/weaver/conversations.bson';
			return fs.existsSync(normalizedPath);
		} catch (error) {
			console.error('Error checking storage directory existence:', error);
			throw error;
		}
	}

	static async readData(plugin: Weaver) {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;
		const filePath = '/bins/weaver/conversations.bson';

		// Check if the file exists and create it if it doesn't
		if (!(await ConversationHelper.storageDirExists(plugin))) {
			await ConversationHelper.writeData(plugin, {
				version: '1.0.0',
				threadss: [],
			});
		}

		const arrayBuffer = await adapter.readBinary(filePath);
		const bsonData = new Uint8Array(arrayBuffer);
		const deserializedData = BSON.deserialize(bsonData);

		return deserializedData;
	}

	static async readConversations(plugin: Weaver, threadId: number): Promise<IChatSession[]> {
		try {
			const data = await ConversationHelper.readData(plugin);
			const profile = data.profiles.find((p: { threadId: number; }) => p.threadId === threadId);
			return profile ? profile.conversations : [];
		} catch (error) {
			console.error('Error reading conversations:', error);
			throw error;
		}
	}

	static async writeData(plugin: Weaver, data: object): Promise<void> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;

			if (!(await ConversationHelper.storageDirExists(plugin))) {
				try {
					await plugin.app.vault.createFolder("/bins/weaver/");
				} catch (error) {
					if (error.message !== 'Folder already exists.') {
						console.error('Error creating folder:', error);
						throw error;
					}
				}
			}

			const bsonData = BSON.serialize(data);
			const buffer = Buffer.from(bsonData.buffer);

			await adapter.writeBinary('/bins/weaver/conversations.bson', buffer);
		} catch (error) {
			console.error('Error writing data:', error);
			throw error;
		}
	}

	static async writeConversations(plugin: Weaver, threadId: number, conversations: IChatSession[]): Promise<void> {
		const data = await ConversationHelper.readData(plugin);
		const profileIndex = data.profiles.findIndex((p: { threadId: number; }) => p.threadId === threadId);

		if (profileIndex !== -1) {
			data.profiles[profileIndex].conversations = conversations;
		} else {
			data.profiles.push({ threadId, threadName: `Base`, conversations });
		}

		await ConversationHelper.writeData(plugin, data);
	}

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
