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

	// TODO:
	// /**
	//  * Ensures that the Weaver folder and the conversations folder inside it exist in the vault.
	//  */
	// public async ensureWeaverFolderExists(): Promise<void> {
	// 	const folderPath = this.plugin.settings.weaverFolder;
	// 	const weaverExists = await this.adapter.exists(folderPath);

	// 	if (!weaverExists) {
	// 		await this.adapter.mkdir(folderPath);
	// 	}

	// 	// Ensure the conversations folder exists inside the Weaver folder
	// 	const conversationsFolderPath = `${folderPath}/conversations`;
	// 	const conversationsExists = await this.adapter.exists(conversationsFolderPath);

	// 	if (!conversationsExists) {
	// 		await this.adapter.mkdir(conversationsFolderPath);
	// 	}
	// }
	
	async onOpen() {
		//#region Services

		// Store
		const storeService = new StoreService();
        const store = await storeService.createStore();

		// Conversation
		const openAIRequestManager  = OpenAIRequestManager.getInstance(this.plugin);
		const conversationIOManager = new ConversationIOManager(this.plugin);
		const conversationService   = new ConversationService(openAIRequestManager, conversationIOManager);
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
