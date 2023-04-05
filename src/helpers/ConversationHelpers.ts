import { FileSystemAdapter, normalizePath } from 'obsidian';
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import { IConversation } from 'components/ChatView';

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
				profiles: [],
			});
		}

		const arrayBuffer = await adapter.readBinary(filePath);
		const bsonData = new Uint8Array(arrayBuffer);
		const deserializedData = BSON.deserialize(bsonData);

		return deserializedData;
	}

	static async readConversations(plugin: Weaver, profileId: number): Promise<IConversation[]> {
		try {
			const data = await ConversationHelper.readData(plugin);
			console.log(data);
			const profile = data.profiles.find((p: { profileId: number; }) => p.profileId === profileId);
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

	static async writeConversations(plugin: Weaver, profileId: number, conversations: IConversation[]): Promise<void> {
		const data = await ConversationHelper.readData(plugin);
		const profileIndex = data.profiles.findIndex((p: { profileId: number; }) => p.profileId === profileId);

		if (profileIndex !== -1) {
			data.profiles[profileIndex].conversations = conversations;
		} else {
			data.profiles.push({ profileId, profileName: `Profile ${profileId}`, conversations });
		}

		await ConversationHelper.writeData(plugin, data);
	}

	static async deleteConversation(plugin: Weaver, profileId: number, conversationId: number): Promise<void> {
		const conversations = await this.readConversations(plugin, profileId);
		const updatedConversations = conversations.filter((conversation) => conversation.id !== conversationId);
		await this.writeConversations(plugin, profileId, updatedConversations);
	}
}
