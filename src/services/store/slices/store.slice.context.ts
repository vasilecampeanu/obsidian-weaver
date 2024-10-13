import Weaver from 'main';
import { StateCreator } from 'zustand';

export interface ContextProps {
    previousConversationId: string | null;
}

export const DEFAULT_CONTEXT_STATES: ContextProps = {
    previousConversationId: null,
};

export interface ContextState extends ContextProps {
    setPreviousConversationId: (previousConversationId: string | null) => void;
}

export const createContexSlice = (plugin: Weaver): StateCreator<
	ContextState,
    [],
    [],
    ContextState
> => (set, get) => {
	/**
	 * Saves the current store data to the local storage.
	 */
	const saveStoreData = async (plugin: Weaver, data: ContextProps): Promise<void> => {
		try {
			await plugin.app.vault.adapter.write(plugin.settings.weaverContextStorage, JSON.stringify(data, null, 4));
		} catch (error) {
			console.error(`Error writing to: ${plugin.settings.weaverContextStorage}`, error);
		}
	};

	return ({
		...DEFAULT_CONTEXT_STATES,
		setPreviousConversationId: (conversationId) => {
			set({ previousConversationId: conversationId });
			saveStoreData(plugin, { previousConversationId: conversationId })
		}
	});
};
