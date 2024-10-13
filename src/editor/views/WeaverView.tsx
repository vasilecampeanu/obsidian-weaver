// components/WeaverView.tsx

import { Plugin } from "components/Plugin";
import Weaver from "main";
import { FileSystemAdapter, ItemView, WorkspaceLeaf } from "obsidian";
import { ConversationContext } from "providers/conversation/ConversationContext";
import { PluginContext } from "providers/plugin/PluginContext";
import { StoreContext } from "providers/store/StoreContext";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { OpenAIRequestManager } from "services/api/providers/OpenAIRequestManager";
import { ConversationIOManager } from "services/conversation/ConversationIOManager";
import { ConversationService } from "services/conversation/ConversationService";
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
		// Initialize the Zustand store with hydration and persistence
		await this.storeService.initializeStore();

		// Initialize other services
		const apiKey = this.plugin.settings.apiKey;
		const openAIRequestManager = new OpenAIRequestManager(apiKey);

		const conversationIOManager = new ConversationIOManager(
			this.plugin.app.vault.adapter as FileSystemAdapter,
			this.plugin.settings.weaverDirectory
		);

		const conversationService = new ConversationService(
			openAIRequestManager,
			conversationIOManager,
			this.storeService.getStore()
		);

		// Initialize the conversation based on settings
		await conversationService.initConversation(
			this.plugin.settings.loadLastConversation
		);

		// Set up React rendering with context providers
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<PluginContext.Provider value={this.plugin}>
					<StoreContext.Provider value={this.storeService.getStore()}>
						<ConversationContext.Provider value={conversationService}>
							<Plugin />
						</ConversationContext.Provider>
					</StoreContext.Provider>
				</PluginContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
