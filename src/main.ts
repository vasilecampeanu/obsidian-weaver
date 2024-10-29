// src/main.ts

import { createWeaverViewPlugin } from 'editor/plugins/WeaverViewPlugin';
import { VIEW_WEAVER, WeaverView } from 'editor/views/WeaverView';
import { Events, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import RecentItemsManager from 'services/RecentItemsManager';
import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from 'settings';

export default class Weaver extends Plugin {
	public events: Events;
	public settings: WeaverSettings;
	public recentItemsManager: RecentItemsManager;

	public async onload() {
		// Load settings early
		await this.loadSettings();
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Create new instance of Events class for custom events
		this.events = new Events();

		// Initialize RecentItemsManager
		this.recentItemsManager = new RecentItemsManager(this);
		await this.recentItemsManager.load();

		// Register the Weaver view
		this.registerView(VIEW_WEAVER, (leaf) => new WeaverView(leaf, this));

		// Register the Editor Extension and pass the custom Events instance
		this.registerEditorExtension(createWeaverViewPlugin(this));

		// Register event listeners for Obsidian events
		this.registerEventListeners();

		// Register plugin commands
		this.registerCommands();

		// Do things after layout is ready
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));

		// Listen for file-open events
		this.registerEvent(this.app.workspace.on('file-open', this.onFileOpen.bind(this)));

		// Listen for file rename and delete events
		this.registerEvent(this.app.vault.on('rename', this.onFileRename.bind(this)));
		this.registerEvent(this.app.vault.on('delete', this.onFileDelete.bind(this)));
	}

	private async onLayoutReady(): Promise<void> {
		if (this.settings.openOnStartup) {
			this.activateView();
		}
	}

	public async onunload() {
		// When unloading
		// Detach all Weaver views
		this.app.workspace.detachLeavesOfType(VIEW_WEAVER);
	}

	private async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private registerEventListeners(): void {
		// TODO: Register custom events if needed
	}

	private registerCommands() {
		this.addCommand({
			id: 'open-weaver-view',
			name: 'Open Weaver',
			callback: () => this.activateView(),
		});
	}

	public async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const existingLeaves = workspace.getLeavesOfType(VIEW_WEAVER);

		if (existingLeaves.length > 0) {
			leaf = existingLeaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_WEAVER, active: true });
		}

		workspace.revealLeaf(leaf!);
	}

	private async onFileOpen(file: TFile): Promise<void> {
		await this.recentItemsManager.onFileOpen(file);
	}

	private async onFileRename(file: TFile, oldPath: string): Promise<void> {
		await this.recentItemsManager.onFileRename(file, oldPath);
	}

	private async onFileDelete(file: TFile): Promise<void> {
		await this.recentItemsManager.onFileDelete(file);
	}
}
