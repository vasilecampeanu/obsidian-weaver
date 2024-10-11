import { createStore } from 'zustand';
import { createConversationSlice } from './slices/store.slice.conversation';
import { WeaverStoreSession } from './slices/store.slicemaster';

export const createWeaverStore = () => {
	return createStore<WeaverStoreSession>()((...args) => ({
		...createConversationSlice()
	}));
}
