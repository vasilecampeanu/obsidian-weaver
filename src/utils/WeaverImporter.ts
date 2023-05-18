import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';
import { IConversation, IChatMessage } from '../interfaces/IThread';
import { FileIOManager } from './FileIOManager';
import { ConversationHelper } from '../helpers/ConversationHelpers';
import { ThreadManager } from './ThreadManager';
import { eventEmitter } from './EventEmitter';

export class WeaverImporter {
	static sanitizeTitle(title: string): string {
		return title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
	}

	static async generateUniqueTitle(adapter: FileSystemAdapter, conversationFolder: string, title: string): Promise<string> {
		let uniqueTitle = title;
		let counter = 1;

		while (await adapter.exists(`${conversationFolder}/${uniqueTitle}.json`)) {
			uniqueTitle = `${title}-${counter}`;
			counter++;
		}

		return uniqueTitle;
	}

	static async importConversations(plugin: Weaver, exportPath: string, conversationsFolderPath: string): Promise<void> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const rawExportData = await adapter.read(normalizePath(exportPath));
			const conversationsData = JSON.parse(rawExportData);

			if (conversationsData.identifier === "obsidian-weaver") {
				return;
			}

			const existingConversations = await ThreadManager.getAllConversations(plugin, conversationsFolderPath);
	
			for (const conversation of conversationsData) {
				const conversationFolder = normalizePath(`${conversationsFolderPath}`);
	
				let conversationTitle = this.sanitizeTitle(conversation.title);
				conversationTitle = await this.generateUniqueTitle(adapter, conversationFolder, conversationTitle);
	
				const conversationPath = `${conversationFolder}/${conversationTitle}.json`;
	
				if (existingConversations.some(existingConversation => existingConversation.id === conversation.id)) {
					continue;
				}
	
				const messages: IChatMessage[] = [];
	
				for (const nodeId in conversation.mapping) {
					const node = conversation.mapping[nodeId];
					const messageData = node.message;

					if (messageData) {
						messages.push({
							content: messageData.content.parts.join(' '),
							context: false,
							creationDate: new Date(messageData.create_time * 1000).toISOString(),
							id: messageData.id,
							role: messageData.author.role,
							parent: node.parent,
							children: node.children
						});
					}
				}
	
				const conversationData: IConversation = {
					context: true,
					creationDate: new Date(conversation.create_time * 1000).toISOString(),
					currentNode: conversation.current_node,
					id: conversation.id,
					identifier: 'obsidian-weaver',
					lastModified: new Date(conversation.update_time * 1000).toISOString(),
					title: conversationTitle,
					messages: messages,
				};
	
				await FileIOManager.ensureFolderPathExists(plugin, "threads/base");
				await adapter.write(conversationPath, JSON.stringify(conversationData, null, 4));
			}

			eventEmitter.emit('reloadThreadViewEvent');
		} catch (error) {
			console.error('Error importing conversations:', error);
		}
	}
}
