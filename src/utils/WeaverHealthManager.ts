import { FileSystemAdapter, normalizePath } from 'obsidian';
import Weaver from 'main';

import { ConversationHelper } from 'helpers/ConversationHelpers';
import { IConversation } from 'interfaces/IThread';
import { ThreadManager } from './ThreadManager';
import { ConversationManager } from './ConversationManager';

export class WeaverHealthManager {
	static async checkForExternalRename(plugin: Weaver): Promise<void> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const conversations = await ThreadManager.getAllConversations(plugin, folderPath);

		for (const conversation of conversations) {
			const filePath = `${folderPath}/${conversation.title}.json`;
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;

			if (!(await adapter.exists(filePath))) {
				const folderContent = await adapter.list(folderPath);

				const matchingFile = folderContent.files.find(async file => {
					const fileContent = await adapter.read(file);
					const fileConversation = JSON.parse(fileContent) as IConversation;

					return fileConversation.id === conversation.id && fileConversation.identifier === 'obsidian-weaver';
				});

				if (matchingFile) {
					const newTitle = matchingFile.replace('.json', '');
					await ConversationManager.updateConversationTitleByPath(plugin, matchingFile, newTitle);
				} else {
					console.error(`File with ID: ${conversation.id} not found`);
				}
			}
		}
	}
}
