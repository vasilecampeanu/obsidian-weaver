import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from './settings'
import { WEAVER_VIEW_TYPE } from './constants'

import { WeaverView } from './components/WeaverView';

export default class Weaver extends Plugin {
	settings: WeaverSettings;

	async onload() {
		// Display a message when loading
		console.log('obsidian-weaver loading ...');

		// Load Settings
		await this.loadSettings();

		// States
		await this.initStates();

		// Init listeners
		this.initListeners();

		// Register Views
		this.registerView(WEAVER_VIEW_TYPE, (leaf) => new WeaverView(leaf, this));

		// Bind plugin components
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
	}

	onunload() {
		new Notice(`Weaver Disabled`);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async initStates() {
	}

	private async initListeners() {
	}

	openWeaver = async () => {
		let leafs = this.app.workspace.getLeavesOfType(WEAVER_VIEW_TYPE);

		if (leafs.length == 0) {
			let leaf = this.app.workspace.getRightLeaf(false);
			await leaf.setViewState({ type: WEAVER_VIEW_TYPE });
			this.app.workspace.revealLeaf(leaf);
		} else {
			leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
		}
	};

	async onLayoutReady(): Promise<void> {
		// Settings Tab
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Commands
		this.addCommand({
			id: "open-weaver",
			name: "Open Weaver",
			callback: () => this.openWeaver(),
			hotkeys: []
		});
	}
}
