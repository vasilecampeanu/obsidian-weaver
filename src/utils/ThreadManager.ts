import { IConversation } from 'interfaces/IThread';
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

export class ThreadManager {
	static async getAllConversations(plugin: Weaver, folderPath: string): Promise<IConversation[]> {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		if (!(await adapter.exists(folderPath))) {
			console.error('Folder does not exist or is not a directory.');
			return [];
		}

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		const fileContentsPromises = filesInFolder.map(async (filePath) => {
			const fileContent = await adapter.read(filePath);
			return JSON.parse(fileContent) as IConversation;
		});

		const conversations = await Promise.all(fileContentsPromises);

		return conversations;
	}
}
