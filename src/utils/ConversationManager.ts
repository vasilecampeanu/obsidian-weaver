import { Conversation, ConversationNode, Message } from 'interfaces/Conversation';
import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import { WeaverFileManager } from './WeaverFileManager';

export class ConversationManager {
    private plugin: Weaver;
    private adapter: FileSystemAdapter;

    constructor(plugin: Weaver) {
        this.plugin = plugin;
        this.adapter = plugin.app.vault.adapter as FileSystemAdapter;
    }

    async listFilesInFolder(folderPath: string): Promise<string[]> {
        const folderContent = await this.adapter.list(folderPath);
        return folderContent.files.filter(filePath => filePath.endsWith('.json'));
    }

    async readFile(filePath: string): Promise<string> {
        return this.adapter.read(filePath);
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        await this.adapter.write(filePath, content);
    }

	generateNewConversation(title: string): Conversation {
        const currentNodeId = uuidv4();
        const currentMessageId = uuidv4();
        const conversationId = uuidv4();

        const message: Message = {
            id: currentMessageId,
            author: {
                role: 'system',
                name: null,
                metadata: {}
            },
            create_time: Date.now(),
            update_time: Date.now(),
            content: {
                content_type: 'text',
                parts: [
					''
				]
            },
            status: 'finished_successfully',
            end_turn: null,
            weight: 1,
            metadata: {},
            recipient: 'all'
        };

        const node: ConversationNode = {
            id: currentNodeId,
            message: message,
            parent: null,
            children: []
        };

        return {
            title: title,
            create_time: Date.now(),
            update_time: Date.now(),
            mapping: {
                [currentNodeId]: node
            },
            moderation_results: [],
            current_node: currentNodeId,
            plugin_ids: null,
            conversation_id: conversationId,
            conversation_template_id: null,
            id: conversationId
        };
    }

	getUniqueTitle(baseTitle: string, conversations: Conversation[]): string {
		let index = 1;
		let proposedTitle = baseTitle;
	
		const existingTitles = conversations.map(conversation => conversation.title);
	
		while (existingTitles.includes(proposedTitle)) {
			index += 1;
			proposedTitle = `${baseTitle} ${index}`;
		}
	
		return proposedTitle;
	}
	
	async createNewConversation(): Promise<Conversation> {
		const folderPath = `${this.plugin.settings.weaverFolderPath}/threads/default`;
        const filesInFolder = await this.listFilesInFolder(folderPath);

        const conversations: Conversation[] = await Promise.all(filesInFolder.map(async filePath => {
            const fileContent = await this.readFile(filePath);
            return JSON.parse(fileContent) as Conversation;
        }));

        const uniqueTitle = this.getUniqueTitle("Untitled", conversations);
        const newConversation = this.generateNewConversation(uniqueTitle);

        // this.plugin.settings.lastConversationId = newConversation.id;
        // this.plugin.settings.loadLastConversationState = true;
        // await this.plugin.saveSettings();

        await WeaverFileManager.ensureWeaverFolderPathExists(this.plugin);
        await WeaverFileManager.ensureFolderPathExists(this.plugin, "threads/default");

        const newFilePath = `${folderPath}/${uniqueTitle}.json`;
        await this.writeFile(newFilePath, JSON.stringify(newConversation, null, 4));

        return newConversation;
	}
}
