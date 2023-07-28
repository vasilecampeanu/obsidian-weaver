// Obsidian
import Weaver from 'main'
import { ItemView, WorkspaceLeaf } from 'obsidian';

// Third-party modules
import React from 'react';
import { createRoot, Root } from "react-dom/client";

// Constants
import { WEAVER_THREAD_VIEW } from '../constants';
import { ThreadTabsManager } from 'components/Thread/ThreadTabsManager';

export class WeaverThreadView extends ItemView {
	private readonly plugin: Weaver;
	private root: Root;

	constructor(leaf: WorkspaceLeaf, plugin: Weaver) {
		super(leaf);
		this.plugin = plugin;
	}

	async onOpen(): Promise<void> {
		this.destroy();
		this.constructWeaverThreadView();
	}

	async onClose(): Promise<void> {
		this.destroy();
	}

	destroy() {
		if (this.root){
			this.root.unmount();
		}
	}

	onResize() {
		super.onResize();
	}

	getIcon(): string {
		return 'git-branch-plus';
	}

	getDisplayText(): string {
		return 'Weaver';
	}

	getViewType(): string {
		return WEAVER_THREAD_VIEW;
	}

	constructWeaverThreadView() {
		this.destroy();

		const viewContent = this.containerEl.querySelector(
			".view-content"
		) as HTMLElement;

		if (viewContent) {
			viewContent.classList.add("ow-view");
			this.appendWeaver(viewContent);
		} else {
			console.error("Could not find view content!");
		}
	}

	private appendWeaver(viewContent: HTMLElement) {
		this.root = createRoot(viewContent);
		this.root.render (
			<ThreadTabsManager plugin={this.plugin} />
		);
	}
}
