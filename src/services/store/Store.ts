import Weaver from "main";
import { createStore } from "zustand";
import { createContexSlice } from "./slices/store.slice.context";
import { createConversationSlice } from "./slices/store.slice.conversation";
import { WeaverStoreProps, WeaverStoreSession } from "./slices/store.slicemaster";

export const createWeaverStore = (
	plugin: Weaver,
    hydration?: Partial<WeaverStoreProps>
) => {
    return createStore<WeaverStoreSession>()((...args) => ({
		...createContexSlice(plugin)(...args),
        ...createConversationSlice()(...args),
        ...hydration
    }));
};

export type WeaverStore = ReturnType<typeof createWeaverStore>;
