import { readJsonFile, writeJsonFile } from 'helpers/FileIOUtils';
import { IConversation, IMessageNode } from 'interfaces/IConversation';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const createConversation = async (
	adapter: FileSystemAdapter,
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
		default_model_slug: 'gpt-4',
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

export const addMessageToConversation = async (
	adapter: FileSystemAdapter,
	weaverDirectory: string,
	conversationId: string,
	messageNode: IMessageNode
): Promise<void> => {
	const conversationsDir = path.join(weaverDirectory, 'conversations');
	const conversation = await getConversation(adapter, weaverDirectory, conversationId);

	if (!conversation) {
		throw new Error('Conversation not found');
	}

	conversation.mapping[messageNode.id] = messageNode;

	if (messageNode.parent) {
		const parentNode = conversation.mapping[messageNode.parent];
		if (parentNode) {
			if (!parentNode.children.includes(messageNode.id)) {
				parentNode.children.push(messageNode.id);
			}
		} else {
			console.warn(`Parent node ${messageNode.parent} not found`);
		}
	}

	conversation.current_node = messageNode.id;
	conversation.update_time = Date.now() / 1000;

	await writeJsonFile(adapter, path.join(conversationsDir, `${conversationId}.json`), conversation);
};

export const getConversation = async (
	adapter: FileSystemAdapter,
	weaverDirectory: string,
	conversationId: string
): Promise<IConversation | null> => {
	const conversationsDir = path.join(weaverDirectory, 'conversations');
	return await readJsonFile<IConversation>(adapter, path.join(conversationsDir, `${conversationId}.json`));
};

export const getConversationPath = async (
	adapter: FileSystemAdapter,
	weaverDirectory: string,
	conversationId: string
): Promise<IMessageNode[]> => {
	const conversation = await getConversation(adapter, weaverDirectory, conversationId);
	if (!conversation) {
		throw new Error('Conversation not found');
	}

	const pathNodes: IMessageNode[] = [];
	let currentNode = conversation.mapping[conversation.current_node];

	while (currentNode) {
		pathNodes.unshift(currentNode);
		if (currentNode.parent) {
			currentNode = conversation.mapping[currentNode.parent];
		} else {
			break;
		}
	}

	return pathNodes;
};
