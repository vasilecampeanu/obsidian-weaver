// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';
import fs from 'fs';

// Interfaces
import { IChatMessage, IChatSession } from 'interfaces/IChats';

// Local modules
import { FileIOManager } from 'helpers/FileIOManager';

export class FileWizard {
	static async getAllFilesInFolder(plugin: Weaver, folderPath: string): Promise<Array<Object>> {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;
		const filesInFolder = (await adapter.list(folderPath)).files;

		const fileInfoPromises = filesInFolder.map(async (filePath) => {
			const filename = filePath.split('/').pop();
			const stat = await adapter.stat(filePath);
			return { name: filename, path: filePath, stat };
		});

		const fileInfos = await Promise.all(fileInfoPromises);

		return fileInfos.filter(fileInfo => fileInfo.stat !== null && fileInfo.stat.type === 'file');
	}

	static async ensureFolderExists(plugin: Weaver, foldername: string): Promise<void> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const backupFolderPath = `/${plugin.settings.weaverFolderPath}/${foldername}`;

			if (!fs.existsSync(adapter.getFullPath(backupFolderPath))) {
				await plugin.app.vault.createFolder(backupFolderPath);
			}
		} catch (error) {
			console.error('Error ensuring backup folder exists:', error);
			throw error;
		}
	}

	static isSupportedFile(data: any): boolean {
		return data && data.identifier !== "obsidian-weaver";
	}
}
