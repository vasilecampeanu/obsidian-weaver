import { App, PluginSettingTab, Setting } from "obsidian";
import Weaver from "main";

export interface WeaverSettings {}
export const DEFAULT_SETTINGS: WeaverSettings = {}

export class WeaverSettingTab extends PluginSettingTab {
	plugin: Weaver;

	constructor(app: App, plugin: Weaver) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h1', { text: 'Weaver Settings' });
	}
}
