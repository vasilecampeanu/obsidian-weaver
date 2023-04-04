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

	static async readConversations(plugin: Weaver): Promise<IConversation[]> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const arrayBuffer = await adapter.readBinary('/bins/weaver/conversations.bson');
	
			const bsonData = new Uint8Array(arrayBuffer);
			const deserializedData = BSON.deserialize(bsonData);
	
			return Array.isArray(deserializedData.conversations) ? deserializedData.conversations : [];
		} catch (error) {
			console.error('Error reading conversations:', error);
			throw error;
		}
	}	

	static async writeConversations(plugin: Weaver, conversations: IConversation[]): Promise<void> {
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

			const dataToSerialize = { conversations: conversations };
			const bsonData = BSON.serialize(dataToSerialize);
			const buffer = Buffer.from(bsonData.buffer);

			await adapter.writeBinary('/bins/weaver/conversations.bson', buffer);
		} catch (error) {
			console.error('Error writing conversations:', error);
			throw error;
		}
	}
}
