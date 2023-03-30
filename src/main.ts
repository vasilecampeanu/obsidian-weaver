import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from './settings'

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
		// ...

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
	};

	async onLayoutReady(): Promise<void> {
		// Settings Tab
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Commands
	}
}
