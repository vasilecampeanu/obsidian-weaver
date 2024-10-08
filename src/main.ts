import { Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from 'settings';
import { VIEW_WEAVER, WeaverView } from 'views/WeaverView';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;

	public async onload() {
		// Load default settings 
		await this.loadSettings();

		this.registerView(
			VIEW_WEAVER,
			(leaf) => new WeaverView(leaf)
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Register plugin commands
		this.registerCommands();
	}

	public async onunload() {
		// TODO: ...
	}

	public async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private async registerCommands() {
		this.addCommand({
			id: 'open-weaver-view',
			name: 'Open Weaver',
			callback: async () => await this.activateView()
		});
	}
	
	public async activateView() {
		const { workspace } = this.app;
	
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_WEAVER);
	
		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_WEAVER, active: true });
		}
	
		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf!);
	  }
}
