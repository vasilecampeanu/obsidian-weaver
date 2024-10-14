import { OpenAIRequestManager } from 'api/providers/OpenAIRequestManager';
import { IConversation } from 'interfaces/IConversation';
import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import { StateCreator } from 'zustand';

export interface ILocalStorage {
	previousConversationId: string | null;
}

export interface ConversationProps extends ILocalStorage {
    conversation: IConversation | null;
}

export const DEFAULT_LOCAL_STORAGE_STATES: ILocalStorage = {
	previousConversationId: null
}

export const DEFAULT_CONVERSATION_STATES: ConversationProps = {
	...DEFAULT_LOCAL_STORAGE_STATES,
    conversation: null,
};

export interface ConversationState extends ConversationProps {
    setConversation: (conversation: IConversation | null) => void;
    setPreviousConversationId: (previousConversationId: string | null) => void;
}

export const createConversationSlice = (
    plugin: Weaver,
    openAIManager: OpenAIRequestManager,
): StateCreator<
    ConversationState,
    [],
    [],
    ConversationState
> => (set, get) => {
	const settings = plugin.settings;
	const adapter  = plugin.app.vault.adapter as FileSystemAdapter;

	const saveContextData = async (plugin: Weaver, data: Partial<ILocalStorage>): Promise<void> => {
		try {
			let existingData: ILocalStorage = DEFAULT_LOCAL_STORAGE_STATES;
	
			if (await adapter.exists(settings.weaverContextStorage)) {
				const fileContents = await adapter.read(settings.weaverContextStorage);
				existingData = JSON.parse(fileContents);
			}
	
			const mergedData = { ...existingData, ...data };
	
			await adapter.write(
				settings.weaverContextStorage,
				JSON.stringify(mergedData, null, 4)
			);
		} catch (error) {
			console.error(`Error writing to: ${settings.weaverContextStorage}`, error);
		}
	};	

	return ({
		...DEFAULT_CONVERSATION_STATES,
		setConversation: (conversation) => set({ conversation }),
		setPreviousConversationId: (conversationId) => {
			set({ previousConversationId: conversationId });
			saveContextData(plugin, { previousConversationId: conversationId })
		},
	});
}
