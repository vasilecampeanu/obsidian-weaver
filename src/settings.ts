import Weaver from "main";
import { App, PluginSettingTab } from "obsidian";

export interface WeaverSettings {
	// TODO: ...
}

export const DEFAULT_SETTINGS: WeaverSettings = {
	// TODO: ...
}

export class WeaverSettingTab extends PluginSettingTab {
	public plugin: Weaver;

	constructor(app: App, plugin: Weaver) {
		super(app, plugin);
		this.plugin = plugin;
	}

	public display(): void {
		// TODO: ...
	}
}
