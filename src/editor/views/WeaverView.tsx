import { Plugin } from "components/Plugin";
import Weaver from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { ChatServiceContext } from "providers/chatservice/ChatServiceContext";
import { PluginContext } from "providers/plugin/PluginContext";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { ChatService } from "services/chat/ChatService";
import { ConversationManager } from "services/chat/ConversationManager";
import { OpenAIManager } from "services/chat/OpenAIManager";

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
		const chatService = new ChatService(openAIManager, conversationManager);
		chatService.initConversation();

		// Render root
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<PluginContext.Provider value={this.plugin}>
					<ChatServiceContext.Provider value={chatService}>
						<Plugin />
					</ChatServiceContext.Provider>
				</PluginContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
