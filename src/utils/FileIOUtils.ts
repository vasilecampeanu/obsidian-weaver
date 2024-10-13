import { FileSystemAdapter } from 'obsidian';

/**
 * Ensures that the specified folders exist. Creates them if they do not.
 * @param adapter - The FileSystemAdapter instance.
 * @param folderPaths - An array of folder paths to ensure exist.
 */
export async function ensureFoldersExist(adapter: FileSystemAdapter, folderPaths: string[]): Promise<void> {
	for (const folderPath of folderPaths) {
		const exists = await adapter.exists(folderPath);
		if (!exists) {
			await adapter.mkdir(folderPath);
		}
	}
}

/**
 * Reads and parses a JSON file.
 * @param adapter - The FileSystemAdapter instance.
 * @param filePath - The path to the JSON file.
 * @returns The parsed JSON object or null if the file does not exist.
 */
export async function readJsonFile<T>(adapter: FileSystemAdapter, filePath: string): Promise<T | null> {
	try {
		const data = await adapter.read(filePath);
		return JSON.parse(data) as T;
	} catch (error: any) {
		if (error.message.includes('ENOENT')) {
			return null;
		}
		console.error(`Error reading file ${filePath}:`, error);
		throw error;
	}
}

/**
 * Writes an object as a JSON file.
 * @param adapter - The FileSystemAdapter instance.
 * @param filePath - The path to the JSON file.
 * @param data - The data to write.
 */
export async function writeJsonFile(adapter: FileSystemAdapter, filePath: string, data: any): Promise<void> {
	try {
		const jsonData = JSON.stringify(data, null, 4);
		await adapter.write(filePath, jsonData);
	} catch (error) {
		console.error(`Error writing to file ${filePath}:`, error);
		throw error;
	}
}
