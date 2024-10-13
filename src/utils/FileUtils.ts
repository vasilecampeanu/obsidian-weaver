import { FileSystemAdapter } from "obsidian";

/**
 * Ensures that the specified folders exist. Creates them if they do not.
 * @param folderPaths - An array of folder paths to ensure exist.
 */
export async function ensureFoldersExist(adapter: FileSystemAdapter, folderPaths: string[]): Promise<void> {
	for (const path of folderPaths) {
		const exists = await adapter.exists(path);
		if (!exists) {
			await adapter.mkdir(path);
		}
	}
}
