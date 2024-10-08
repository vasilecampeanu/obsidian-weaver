import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from 'settings';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;

	public async onload() {
		// Load default settings 
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new WeaverSettingTab(this.app, this));
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
}
