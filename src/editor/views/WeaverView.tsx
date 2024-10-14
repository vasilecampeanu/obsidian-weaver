// components/WeaverView.tsx

import { Plugin } from "components/Plugin";
import Weaver from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { PluginContext } from "providers/plugin/PluginContext";
import { StoreContext } from "providers/store/StoreContext";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { StoreService } from "services/store/StoreService";

export const VIEW_WEAVER = "weaver-view";

export class WeaverView extends ItemView {
    private root: Root | null = null;
    private storeService: StoreService;

    constructor(leaf: WorkspaceLeaf, private plugin: Weaver) {
        super(leaf);
        this.storeService = new StoreService(plugin);
    }

    getViewType() {
        return VIEW_WEAVER;
    }

    getDisplayText() {
        return "Weaver";
    }

    getIcon(): string {
        return "drama";
    }

    async onOpen() {
        // Initialize the Zustand store with hydration, persistence, and conversation
        const store = await this.storeService.initializeStore();
	
        // Set up React rendering with context providers
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <StrictMode>
                <PluginContext.Provider value={this.plugin}>
                    <StoreContext.Provider value={store}>
                        <Plugin />
                    </StoreContext.Provider>
                </PluginContext.Provider>
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}
