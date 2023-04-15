// Obsidian
import Weaver from 'main'
import { ItemView, Platform, WorkspaceLeaf } from 'obsidian';

// Third-party modules
import React from 'react';
import { createRoot, Root } from "react-dom/client";

// Componets
import { TabsManager } from './TabsManager';

// Constants
import { WEAVER_CHAT_VIEW_TYPE } from '../../constants';

export class WeaverChatView extends ItemView {
	private readonly plugin: Weaver;
	private root: Root;

	constructor(leaf: WorkspaceLeaf, plugin: Weaver) {
		super(leaf);
		this.plugin = plugin;
	}

	async onOpen(): Promise<void> {
		this.destroy();
		this.constructWeaverChatView();
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
		return 'Weaver Chat';
	}

	getViewType(): string {
		return WEAVER_CHAT_VIEW_TYPE;
	}

	constructWeaverChatView() {
		this.destroy();

		const viewContent = this.containerEl.querySelector(
			".view-content"
		) as HTMLElement;

		if (viewContent) {
			viewContent.classList.add("weaver-view");
			this.appendWeaver(viewContent);
		} else {
			console.error("Could not find view content!");
		}
	}

	private appendWeaver(viewContent: HTMLElement) {
		this.root = createRoot(viewContent);
		this.root.render (
			<TabsManager plugin={ this.plugin } />
 		);
	}
}
