import { Plugin } from "components/Plugin";
import Weaver from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { ConversationServiceContext } from "providers/conversationservice/ConversationServiceContext";
import { PluginContext } from "providers/plugin/PluginContext";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { OpenAIManager } from "services/assistant/OpenAIManager";
import { ConversationManager } from "services/conversation/ConversationManager";
import { ConversationService } from "services/conversation/ConversationService";

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

		// Services
		const conversationService = new ConversationService(openAIManager, conversationManager);
		conversationService.initConversation();

		// Render root
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<PluginContext.Provider value={this.plugin}>
					<ConversationServiceContext.Provider value={conversationService}>
						<Plugin />
					</ConversationServiceContext.Provider>
				</PluginContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
