import { Plugin } from "components/Plugin";
import { PluginContext } from "components/PluginContext";
import Weaver from "main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";

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
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<PluginContext.Provider value={this.plugin}>
					<Plugin />
				</PluginContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
