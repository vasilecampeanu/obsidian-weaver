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
