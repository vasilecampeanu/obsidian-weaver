import { EChatModels } from 'enums/EProviders';
import { readJsonFile, writeJsonFile } from 'helpers/FileIOUtils';
import { IConversation, IMessageNode } from 'interfaces/IConversation';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new conversation and saves it to the conversations directory.
 *
 * @param adapter - The FileSystemAdapter instance from Obsidian.
 * @param model - The chat model to be used for the conversation.
 * @param weaverDirectory - The root directory where the 'conversations' folder resides.
 * @param title - The title of the conversation.
 * @returns A promise that resolves to the newly created IConversation object.
 */
export const createConversation = async (
	adapter: FileSystemAdapter,
	model: EChatModels,
	weaverDirectory: string,
	title: string
): Promise<IConversation> => {
	const conversationsDir = path.join(weaverDirectory, 'conversations');
	const conversationId = uuidv4();
	const now = Date.now() / 1000;

	const conversation: IConversation = {
		title,
		create_time: now,
		update_time: now,
		mapping: {},
		moderation_results: [],
		current_node: '',
		plugin_ids: null,
		conversation_id: conversationId,
		conversation_template_id: null,
		gizmo_id: null,
		is_archived: false,
		safe_urls: [],
		default_model_slug: model,
		conversation_origin: null,
		voice: null,
		async_status: null,
		id: conversationId,
	};

	const systemNodeId = uuidv4();
	const systemMessageNode: IMessageNode = {
		id: systemNodeId,
		message: null,
		parent: null,
		children: [],
	};

	conversation.mapping[systemNodeId] = systemMessageNode;
	conversation.current_node = systemNodeId;

	await writeJsonFile(adapter, path.join(conversationsDir, `${conversationId}.json`), conversation);

	return conversation;
};

/**
 * Writes (updates) an existing conversation to the conversations directory.
 *
 * @param adapter - The FileSystemAdapter instance from Obsidian.
 * @param weaverDirectory - The root directory where the 'conversations' folder resides.
 * @param conversation - The IConversation object to be written.
 * @returns A promise that resolves when the write operation is complete.
 */
export const writeConversation = async (
	adapter: FileSystemAdapter,
	weaverDirectory: string,
	conversation: IConversation
): Promise<void> => {
	const conversationsDir = path.join(weaverDirectory, 'conversations');
	await writeJsonFile(adapter, path.join(conversationsDir, `${conversation.id}.json`), conversation);
};

/**
 * Retrieves a specific conversation by its ID from the conversations directory.
 *
 * @param adapter - The FileSystemAdapter instance from Obsidian.
 * @param weaverDirectory - The root directory where the 'conversations' folder resides.
 * @param conversationId - The unique identifier of the conversation to retrieve.
 * @returns A promise that resolves to the IConversation object if found, or null otherwise.
 */
export const getConversation = async (
	adapter: FileSystemAdapter,
	weaverDirectory: string,
	conversationId: string
): Promise<IConversation | null> => {
	const conversationsDir = path.join(weaverDirectory, 'conversations');
	return await readJsonFile<IConversation>(adapter, path.join(conversationsDir, `${conversationId}.json`));
};

/**
 * Retrieves all conversation objects from the 'conversations' directory.
 *
 * @param adapter - The FileSystemAdapter instance from Obsidian.
 * @param weaverDirectory - The root directory where the 'conversations' folder resides.
 * @returns A promise that resolves to an array of IConversation objects.
 */
export const getAllConversations = async (
	adapter: FileSystemAdapter,
	weaverDirectory: string
): Promise<IConversation[]> => {
	const conversationsDir = path.join(weaverDirectory, 'conversations');

	// Check if the 'conversations' directory exists
	const exists = await adapter.exists(conversationsDir);
	if (!exists) {
		console.error(`Conversations directory does not exist: ${conversationsDir}`);
		return [];
	}

	try {
		// List all items in the 'conversations' directory
		const folderContent = await adapter.list(conversationsDir);

		// Filter out only JSON files which represent conversations
		const jsonFiles = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		// Map each JSON file path to a promise that resolves to an IConversation object
		const conversationPromises = jsonFiles.map(async (filePath) => {
			try {
				const conversation = await readJsonFile<IConversation>(adapter, filePath);
				return conversation;
			} catch (error) {
				console.error(`Failed to read conversation from ${filePath}:`, error);
				return null;
			}
		});

		// Await all promises and filter out any null results due to read errors
		const conversations = await Promise.all(conversationPromises);
		return conversations.filter((convo): convo is IConversation => convo !== null);
	} catch (error) {
		console.error(`Error reading conversations from ${conversationsDir}:`, error);
		return [];
	}
};

/**
 * Deletes a conversation by its ID from the conversations directory.
 *
 * @param adapter - The FileSystemAdapter instance from Obsidian.
 * @param weaverDirectory - The root directory where the 'conversations' folder resides.
 * @param conversationId - The unique identifier of the conversation to delete.
 * @returns A promise that resolves when the delete operation is complete.
 */
export const deleteConversation = async (
	adapter: FileSystemAdapter,
	weaverDirectory: string,
	conversationId: string
): Promise<void> => {
	const conversationsDir = path.join(weaverDirectory, 'conversations');
	const conversationFilePath = path.join(conversationsDir, `${conversationId}.json`);

	// Check if the conversation file exists before attempting to delete
	const exists = await adapter.exists(conversationFilePath);
	if (!exists) {
		console.error(`Conversation file does not exist: ${conversationFilePath}`);
		return;
	}

	try {
		await adapter.remove(conversationFilePath);
		console.log(`Deleted conversation: ${conversationId}`);
	} catch (error) {
		console.error(`Failed to delete conversation ${conversationId}:`, error);
	}
};
