// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, Plugin, normalizePath, TFile } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Interfaces
import { IChatMessage, IChatSession, IChatThread, IDescriptor } from 'interfaces/IChats';

// Local modules
import { FileIOManager } from 'helpers/FileIOManager';
import { FileWizard } from './FileWizard';
import { ConversationBsonManager } from './ConversationBsonManager';
import { MetadataManager } from './MetadataManager';

export class DescriptorManager {
	static async descriptorExists(plugin: Weaver): Promise<boolean> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const filePath = `/${plugin.settings.weaverFolderPath}/descriptor.bson`;
			return await adapter.exists(filePath);
		} catch (error) {
			console.error('Error checking descriptor existence:', error);
			throw error;
		}
	}

	static async writeDescriptor(plugin: Weaver, data: object): Promise<void> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const descriptorPath = `/${plugin.settings.weaverFolderPath}/descriptor.bson`;
			
			// console.log("Write descriptor:", data);
			
			const bsonData = BSON.serialize(data);
			const buffer = Buffer.from(bsonData.buffer);
			await adapter.writeBinary(descriptorPath, buffer);
		} catch (error) {
			console.error('Error writing descriptor:', error);
			throw error;
		}
	}

	static async readDescriptor(plugin: Weaver): Promise<any> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const descriptorPath = `/${plugin.settings.weaverFolderPath}/descriptor.bson`;

			if (!(await DescriptorManager.descriptorExists(plugin))) {
				await DescriptorManager.regenerateDescriptor(plugin);
			}

			const arrayBuffer = await adapter.readBinary(descriptorPath);
			const bsonData = new Uint8Array(arrayBuffer);
			const deserializedData = BSON.deserialize(bsonData);

			if (FileWizard.isSupportedFile(deserializedData)) {
				throw `Unsupported file: descriptor.bson. The file must have the "obsidian-weaver" identifier.`;
			}

			// console.log("Descriptor readed:", deserializedData);

			return deserializedData;
		} catch (error) {
			console.error('Error reading descriptor:', error);
			throw error;
		}
	}

	static async regenerateDescriptor(plugin: Weaver): Promise<void> {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;
		const folderThreads = (await adapter.list(plugin.settings.weaverFolderPath + "/threads")).folders;

		let totalConversations = 0;

		const threadsPromises = folderThreads.map(async (threadFolder) => {
			const bsonFileRegex = /\.bson$/;
			const threadConversations = (await adapter.list(threadFolder)).files;

			const conversationsPromises = threadConversations
				.filter((conversationPath) => bsonFileRegex.test(conversationPath))
				.map(async (conversationPath) => {
					const trimmedPath = conversationPath.replace("bins/weaver/", "");
					const conversation = await ConversationBsonManager.readConversationByFilePath(plugin, trimmedPath);
					const metadataObject = await MetadataManager.metadataObjectManager(conversation, true);
					return metadataObject;
				});

			const conversations = await Promise.all(conversationsPromises);
			totalConversations += conversations.length;

			return {
				conversations: conversations,
				description: "",
				id: 0,
				title: threadFolder.split('/').pop() || "",
			};
		});

		const threads: IChatThread[] = await Promise.all(threadsPromises);

		if (totalConversations === 0) {
			const emptyDescriptor: IDescriptor = {
				version: "2.0.0",
				identifier: "obsidian-weaver",
				threads: [
					{
						description: "",
						id: 0,
						title: "Untitled",
						conversations: [],
					}
				]
			};
			this.writeDescriptor(plugin, emptyDescriptor);
			return;
		}

		const descriptor: IDescriptor = {
			version: "2.0.0",
			identifier: "obsidian-weaver",
			threads: threads,
		};

		this.writeDescriptor(plugin, descriptor);
	}
}
