import { IChatMessage, IConversation } from 'interfaces/IThread';
import Weaver from 'main';
import { FileSystemAdapter, normalizePath } from 'obsidian';
import { ThreadManager } from './ThreadManager';
import { v4 as uuidv4 } from 'uuid';
import { FileIOManager } from './FileIOManager';

export class ConversationManager {
	static async createNewConversation(plugin: Weaver): Promise<IConversation> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		const conversations: IConversation[] = [];

		// Iterate through files to build conversations list
		for (const filePath of filesInFolder) {
			const fileContent = await adapter.read(filePath);
			const conversation = JSON.parse(fileContent) as IConversation;
			conversations.push(conversation);
		}

		// Check for duplicate titles and adjust title if necessary
		const uniqueTitle = this.getUniqueTitle("Untitled", conversations);

		const currentNodeId = uuidv4();

		// Create a new conversation object
		const newConversation: IConversation = {
			id: uuidv4(), // Generate a unique id
			title: uniqueTitle,
			identifier: 'obsidian-weaver',
			currentNode: currentNodeId,
			context: true,
			creationDate: new Date().toISOString(),
			lastModified: new Date().toISOString(),
			messages: [
				{
					children: [],
					content: `${plugin.settings.systemRolePrompt}`,
					context: false,
					creationDate: new Date().toISOString(),
					id: currentNodeId,
					model: plugin.settings.engine,
					mode: "balanced",
					role: "system",
					parent: uuidv4(),
				}
			],
			mode: "balanced",
			model: plugin.settings.engine
		};

		plugin.settings.lastConversationId = newConversation.id;
		plugin.settings.loadLastConversationState = true;
		await plugin.saveSettings();

		// Ensure the folder exists
		await FileIOManager.ensureWeaverFolderPathExists(plugin);
		await FileIOManager.ensureFolderPathExists(plugin, "threads/base");

		// Ensure wevaer folder exists
		const newFilePath = `${folderPath}/${uniqueTitle}.json`;
		await adapter.write(newFilePath, JSON.stringify(newConversation, null, 4));

		return newConversation;
	}

	static async deleteConversation(plugin: Weaver, id: string): Promise<void> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		for (const filePath of filesInFolder) {
			const fileContent = await adapter.read(filePath);
			const conversation = JSON.parse(fileContent) as IConversation;

			if (conversation.id === id && conversation.identifier === 'obsidian-weaver') {
				plugin.isRenamingFromInside = true;
				await adapter.remove(filePath);
				plugin.isRenamingFromInside = false;
				return;
			}
		}

		console.error(`Conversation with ID: ${id} not found`);
	}

	static async updateConversation(plugin: Weaver, updatedConversation: IConversation): Promise<boolean> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		for (const filePath of filesInFolder) {
			const fileContent = await adapter.read(filePath);
			const conversation = JSON.parse(fileContent) as IConversation;

			if (conversation.id === updatedConversation.id && conversation.identifier === 'obsidian-weaver') {
				// Validate the updated conversation object
				if (!updatedConversation.id || !updatedConversation.identifier || !updatedConversation.currentNode || !updatedConversation.messages) {
					console.error('The updated conversation is missing required fields.');
					throw new Error('The updated conversation is missing required fields.');
				}

				updatedConversation.messages = conversation.messages;

				// Write the updated conversation back to the file
				await adapter.write(filePath, JSON.stringify(updatedConversation, null, 4));

				return true;
			}
		}

		console.error(`Conversation with ID: ${updatedConversation.id} not found`);
		return false;
	}

	static getUniqueTitle(initialTitle: string, conversations: IConversation[]): string {
		let uniqueTitle = initialTitle;
		let index = 1;

		const titles = conversations.map(conversation => conversation.title);

		while (titles.includes(uniqueTitle)) {
			uniqueTitle = `${initialTitle} ${index}`;
			index++;
		}

		return uniqueTitle;
	}

	static async updateConversationTitleById(plugin: Weaver, id: string, newTitle: string): Promise<{ success: boolean; errorMessage?: string }> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
			const folderContent = await adapter.list(folderPath);
			const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

			const conversations: IConversation[] = [];

			// Iterate through files to build conversations list
			for (const filePath of filesInFolder) {
				const fileContent = await adapter.read(filePath);
				const conversation = JSON.parse(fileContent) as IConversation;
				conversations.push(conversation);
			}

			// Check for duplicate titles and adjust newTitle if necessary
			newTitle = this.getUniqueTitle(newTitle, conversations);

			// Iterate through files again to update the conversation with the correct id
			for (const filePath of filesInFolder) {
				const fileContent = await adapter.read(filePath);
				const conversation = JSON.parse(fileContent) as IConversation;

				if (conversation.id === id && conversation.identifier === 'obsidian-weaver') {
					plugin.isRenamingFromInside = true;
					conversation.title = newTitle;
					await adapter.write(filePath, JSON.stringify(conversation, null, 4));
					const newFilePath = `${folderPath}/${newTitle}.json`;
					await adapter.rename(filePath, newFilePath);
					plugin.isRenamingFromInside = false;
				}
			}

			return { success: true };
		} catch (error) {
			console.error(`Error updating conversation title: ${error}`);
			return { success: false, errorMessage: error.message };
		}
	}

	static async updateConversationTitleByPath(plugin: Weaver, filePath: string, newTitle: string): Promise<void> {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		if (!(await adapter.exists(filePath))) {
			console.error('File does not exist or is not a directory.');
			return;
		}

		const fileContent = await adapter.read(filePath);
		const conversation = JSON.parse(fileContent) as IConversation;

		if (conversation.identifier === 'obsidian-weaver') {
			conversation.title = newTitle;
			await adapter.write(filePath, JSON.stringify(conversation, null, 4));
			return;
		}

		console.log(`File with path: ${filePath} does not have the required identifier.`);
	}

	static async addMessageToConversation(plugin: Weaver, id: string, newMessage: IChatMessage): Promise<IChatMessage[]> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		for (const filePath of filesInFolder) {
			const fileContent = await adapter.read(filePath);
			const conversation = JSON.parse(fileContent) as IConversation;

			if (conversation.id === id && conversation.identifier === 'obsidian-weaver') {
				// Ensure the message is valid
				if (!newMessage.id || !newMessage.content || !newMessage.creationDate || !newMessage.role || !newMessage.parent) {
					console.error('The new message is missing required fields.');
					throw new Error('The new message is missing required fields.');
				}

				// Add the new message to the conversation
				conversation.messages.push(newMessage);

				// Update parent message's children array
				const parentMessage = conversation.messages.find(message => message.id === newMessage.parent);

				if (parentMessage) {
					parentMessage.children.push(newMessage.id);
				}

				// Update currentNode if the new message is a response to it
				if (conversation.currentNode === newMessage.parent) {
					conversation.currentNode = newMessage.id;
				}

				conversation.lastModified = new Date().toISOString();

				// Write the updated conversation back to the file
				await adapter.write(filePath, JSON.stringify(conversation, null, 4));

				return conversation.messages;
			}
		}

		console.error(`Conversation with ID: ${id} not found`);
		return [];
	}

	static async addChildToMessage(plugin: Weaver, conversationId: string, messageId: string, newChildId: string): Promise<boolean> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		for (const filePath of filesInFolder) {
			const fileContent = await adapter.read(filePath);
			const conversation = JSON.parse(fileContent) as IConversation;

			if (conversation.id === conversationId && conversation.identifier === 'obsidian-weaver') {
				// Find the target message in the conversation's messages
				const targetMessage = conversation.messages.find(message => message.id === messageId);

				if (!targetMessage) {
					console.error('Target message not found in the conversation.');
					return false;
				}

				// Add the new child id to the target message's children array
				targetMessage.children.push(newChildId);

				// Update lastModified
				conversation.lastModified = new Date().toISOString();

				// Write the updated conversation back to the file
				await adapter.write(filePath, JSON.stringify(conversation, null, 4));

				return true;
			}
		}

		console.error(`Conversation with ID: ${conversationId} not found`);
		return false;
	}

	static async updateConversationModel(plugin: Weaver, id: string, newModel: string): Promise<boolean> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		for (const filePath of filesInFolder) {
			const fileContent = await adapter.read(filePath);
			const conversation = JSON.parse(fileContent) as IConversation;

			if (conversation.id === id && conversation.identifier === 'obsidian-weaver') {
				conversation.model = newModel;
				conversation.lastModified = new Date().toISOString();

				await adapter.write(filePath, JSON.stringify(conversation, null, 4));
				return true;
			}
		}

		console.error(`Conversation with ID: ${id} not found`);
		return false;
	}

	static async updateConversationMode(plugin: Weaver, id: string, newMode: string): Promise<boolean> {
		const folderPath = `${plugin.settings.weaverFolderPath}/threads/base`;
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;

		const folderContent = await adapter.list(folderPath);
		const filesInFolder = folderContent.files.filter(filePath => filePath.endsWith('.json'));

		for (const filePath of filesInFolder) {
			const fileContent = await adapter.read(filePath);
			const conversation = JSON.parse(fileContent) as IConversation;

			if (conversation.id === id && conversation.identifier === 'obsidian-weaver') {
				conversation.mode = newMode;
				conversation.lastModified = new Date().toISOString();

				await adapter.write(filePath, JSON.stringify(conversation, null, 4));
				return true;
			}
		}

		console.error(`Conversation with ID: ${id} not found`);
		return false;
	}
}
