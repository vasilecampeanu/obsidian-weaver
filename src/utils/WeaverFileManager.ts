import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import fs from 'fs';

export class WeaverFileManager {

    private static getAdapter(plugin: Weaver): FileSystemAdapter {
        return plugin.app.vault.adapter as FileSystemAdapter;
    }

    private static folderExists(adapter: FileSystemAdapter, path: string): boolean {
        return fs.existsSync(adapter.getFullPath(path));
    }

	static async listFilesInFolder(plugin: Weaver, folderPath: string): Promise<string[]> {
		const adapter = this.getAdapter(plugin);
		const folderContent = await adapter.list(folderPath);
		return folderContent.files.filter(filePath => filePath.endsWith('.json'));
	}
	
	static async readFile(plugin: Weaver, filePath: string): Promise<string> {
		const adapter = this.getAdapter(plugin);
		return adapter.read(filePath);
	}
	
	static async writeFile(plugin: Weaver, filePath: string, content: string): Promise<void> {
		const adapter = this.getAdapter(plugin);
		await adapter.write(filePath, content);
	}	

    private static async createFolderIfNotExists(plugin: Weaver, path: string): Promise<void> {
        const adapter = this.getAdapter(plugin);
        if (!this.folderExists(adapter, path)) {
            await plugin.app.vault.createFolder(path);
        }
    }

    static async ensureWeaverFolderPathExists(plugin: Weaver): Promise<void> {
        try {
            const weaverFolderPath = `/${plugin.settings.weaverFolderPath}`;
            await this.createFolderIfNotExists(plugin, weaverFolderPath);
        } catch (error) {
            console.error('Error ensuring Weaver folder path exists:', error);
            throw error;
        }
    }

    static async ensureFolderPathExists(plugin: Weaver, foldername: string): Promise<void> {
        try {
            await this.ensureWeaverFolderPathExists(plugin);
            const weaverFolderPath = `/${plugin.settings.weaverFolderPath}/${foldername}`;
            await this.createFolderIfNotExists(plugin, weaverFolderPath);
        } catch (error) {
            console.error(`Error ensuring ${foldername} folder exists:`, error);
            throw error;
        }
    }
}
