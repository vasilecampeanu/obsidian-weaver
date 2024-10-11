import { Plugin } from "components/Plugin";
import Weaver from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { ConversationContext } from "providers/conversation/ConversationContext";
import { PluginContext } from "providers/plugin/PluginContext";
import { StoreContext } from "providers/store/StoreContext";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { OpenAIManager } from "services/assistant/OpenAIManager";
import { ConversationManager } from "services/conversation/ConversationManager";
import { ConversationService } from "services/conversation/ConversationService";
import { StoreService } from "services/store/StoreService";

export const VIEW_WEAVER = "weaver-view";

export class WeaverView extends ItemView {
	private root: Root | null = null;
	private plugin: Weaver;

	constructor(leaf: WorkspaceLeaf, plugin: Weaver) {
		super(leaf);

		// Get a reference to the obsidian weaver plugin
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
		// Initialize managers
		const openAIManager = OpenAIManager.getInstance(this.plugin);
		const conversationManager = new ConversationManager(this.plugin);

		//#region 

		// Store
		const storeService = new StoreService();
        const store = await storeService.createStore();

		// Conversation
		const conversationService = new ConversationService(openAIManager, conversationManager);
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
