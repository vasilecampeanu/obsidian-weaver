import { App, PluginSettingTab } from 'obsidian';
import Weaver from 'main';

import { WeaverSettings } from 'interfaces/WeaverSettings';

export const DEFAULT_SETTINGS: WeaverSettings = {
	weaverFolderPath: "bins/weaver",
}

export class SampleSettingTab extends PluginSettingTab {
	private readonly plugin: Weaver;

	constructor(app: App, plugin: Weaver) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
	}
}
