import { createWeaverViewPlugin } from 'editor/plugins/WeaverViewPlugin';
import { Events, Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from 'settings';
import { VIEW_WEAVER, WeaverView } from 'views/WeaverView';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;
	public events: Events;

	public async onload() {
		// Load settings early
		await this.loadSettings();
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Create new instance of Events class for custom events
		this.events = new Events();

		// Register the Weaver view
		this.registerView(
			VIEW_WEAVER, 
			(leaf) => new WeaverView(leaf, this)
		);

		// Register the Editor Extension and pass the custom Events instance
		this.registerEditorExtension(createWeaverViewPlugin(this));

		// Register event listeners for custom events
		this.registerEventListeners();

		// Register plugin commands
		this.registerCommands();
	}

	public async onunload() {
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
		// TODO: Register events
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
}
