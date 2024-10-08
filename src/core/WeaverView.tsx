import { ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";

export const VIEW_WEAVER = "weaver-view";

export class WeaverView extends ItemView {
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
				<div>
					Hello world!
				</div>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
