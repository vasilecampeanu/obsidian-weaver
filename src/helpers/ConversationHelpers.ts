import { FileSystemAdapter, normalizePath } from 'obsidian';
import { IConversation } from 'components/ChatView';

export class ConversationHelper {
	static async readConversations(adapter: FileSystemAdapter, configDir: string): Promise<IConversation[]> {
		const normalizedPath = normalizePath(configDir + '/plugins/obsidian-weaver/conversations.json');
		const data = await adapter.read(normalizedPath);
		return data ? JSON.parse(data) : [];
	}

	static async writeConversations(adapter: FileSystemAdapter, configDir: string, conversations: IConversation[]): Promise<void> {
		const normalizedPath = normalizePath(configDir + '/plugins/obsidian-weaver/conversations.json');
		await adapter.write(normalizedPath, JSON.stringify(conversations, null, 4));
	}
}
