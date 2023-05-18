// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';

// Third-party modules
import fs from 'fs';

export class FileIOManager {
	static async ensureWeaverFolderPathExists(plugin: Weaver): Promise<void> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const weaverFolderPath = `/${plugin.settings.weaverFolderPath}`;
	
			if (!fs.existsSync(adapter.getFullPath(weaverFolderPath))) {
				await plugin.app.vault.createFolder(weaverFolderPath);
			}
		} catch (error) {
			console.error('Error ensuring Weaver folder path exists:', error);
			throw error;
		}
	}

	static async ensureFolderPathExists(plugin: Weaver, foldername: string): Promise<void> {
		try {
			await this.ensureWeaverFolderPathExists(plugin);
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const weaverFolderPath = `/${plugin.settings.weaverFolderPath}/${foldername}`;
	
			if (!fs.existsSync(adapter.getFullPath(weaverFolderPath))) {
				await plugin.app.vault.createFolder(weaverFolderPath);
			}
		} catch (error) {
			console.error(`Error ensuring ${foldername} folder exists:`, error);
			throw error;
		}
	}
}
