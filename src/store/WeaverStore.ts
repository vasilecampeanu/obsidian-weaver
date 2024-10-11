import { createStore } from 'zustand';
import { createConversationSlice } from './slices/store.slice.conversation';
import { WeaverStoreProps, WeaverStoreSession } from './slices/store.slicemaster';

export const createWeaverStore = (hydration: Partial<WeaverStoreProps>) => {
	return createStore<WeaverStoreSession>()((...args) => ({
		...createConversationSlice(),
        ...hydration
	}));
}
