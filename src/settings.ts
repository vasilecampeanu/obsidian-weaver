import { EChatModels } from "enums/EProviders";
import Weaver from "main";
import { App, PluginSettingTab, Setting, TextComponent } from "obsidian";

export interface WeaverSettings {
	apiKey: string,
	weaverDirectory: string,
	weaverContextStorage: string,
	loadLastConversation: boolean,
	model: EChatModels
}

export const DEFAULT_SETTINGS: WeaverSettings = {
	apiKey: "",
	weaverDirectory: ".weaver",
	get weaverContextStorage() {
		return `${this.weaverDirectory}/context.json`;
	},
	loadLastConversation: true,
	model: EChatModels.GPT_4
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

		let inputEl: TextComponent;
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
					inputEl = textEl;
				})
				.inputEl.setAttribute('type', 'password')
			);

		new Setting(containerEl)
			.setName('Model')
			.setDesc('This allows you to choose which model the chat view should utilize.')
			.addDropdown((dropdown) => {
				Object.values(EChatModels).forEach((model) => {
					const label = model.toUpperCase().replace(/_/g, ' ');
					dropdown.addOption(model, label);
				});
				dropdown.setValue(this.plugin.settings.model);
				dropdown.onChange(async (value) => {
					this.plugin.settings.model = value as EChatModels;
					await this.plugin.saveSettings();
				});
			});
	}
}
