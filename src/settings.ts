import Weaver from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface WeaverSettings {
	apiKey: string,
	weaverDirectory: string,
	weaverContextStorage: string,
	loadLastConversation: boolean
}

export const DEFAULT_SETTINGS: WeaverSettings = {
	apiKey: "",
	weaverDirectory: ".weaver",
	get weaverContextStorage() {
		return `${this.weaverDirectory}/context.json`;
	},
	loadLastConversation: true
};

export class WeaverSettingTab extends PluginSettingTab {
	public plugin: Weaver;

	constructor(app: App, plugin: Weaver) {
		super(app, plugin);
		this.plugin = plugin;
	}

	public display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h1', { text: 'Weaver Settings' });

		containerEl.createEl('h2', {
			text: 'OpenAI'
		});

		let inputEl;
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('You can get an API key from your OpenAI account.')
			.addText(text => text
				.setPlaceholder('Enter your API Key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				})
				.then((textEl) => {
					inputEl = textEl
				})
				.inputEl.setAttribute('type', 'password')
			)
	}
}
