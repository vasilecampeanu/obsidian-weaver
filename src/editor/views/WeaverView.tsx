import { Plugin } from "components/Plugin";
import Weaver from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
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
	private plugin: Weaver;

	constructor(leaf: WorkspaceLeaf, plugin: Weaver) {
		super(leaf);
		this.plugin = plugin;
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
		//#region Services

		// Create store service and initialize local storage
		const storeService = new StoreService(this.plugin);
		await storeService.ensureLocalStorage();

		// Create Zustand store
		const store = await storeService.createStore();

		// Initialize conversation services
		const openAIRequestManager = OpenAIRequestManager.getInstance(this.plugin);
		const conversationIOManager = new ConversationIOManager(this.plugin);
		const conversationService = new ConversationService(openAIRequestManager, conversationIOManager, store, this.plugin);
		await conversationService.initConversation();

		//#endregion

		// Render root
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<PluginContext.Provider value={this.plugin}>
					<StoreContext.Provider value={store}>
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
