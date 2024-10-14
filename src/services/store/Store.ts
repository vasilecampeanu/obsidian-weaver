import { OpenAIRequestManager } from "api/providers/OpenAIRequestManager";
import Weaver from "main";
import { createStore } from "zustand";
import { createConversationSlice } from "./slices/store.slice.conversation";
import { WeaverStoreProps, WeaverStoreSession } from "./slices/store.slicemaster";

export const createWeaverStore = (
    plugin: Weaver,
    openAIManager: OpenAIRequestManager,
    hydration?: Partial<WeaverStoreProps>
) => {
    return createStore<WeaverStoreSession>()((...args) => ({
        ...createConversationSlice(plugin, openAIManager)(...args),
        ...hydration
    }));
};

export type WeaverStore = ReturnType<typeof createWeaverStore>;
