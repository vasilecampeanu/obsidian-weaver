import { App, PluginSettingTab, Setting } from "obsidian";
import Weaver from "main";

export interface WeaverSettings {
	api_key: string,
	engine: string,
	models: any,
	max_tokens: number,
	temperature: number,
	frequency_penalty: number,
	prompt: string
}

export const DEFAULT_SETTINGS: WeaverSettings = {
	api_key: "",
	engine: "gpt-3.5-turbo",
	models: undefined,
	max_tokens: 512,
	temperature: 0.7,
	frequency_penalty: 0.5,
	prompt: ""
}

export class WeaverSettingTab extends PluginSettingTab {
	plugin: Weaver;
	app: App;

	constructor(app: App, plugin: Weaver) {
		super(app, plugin);

		this.plugin = plugin;
		this.app = app;

		let models = new Map();

		if (this.plugin.settings.models?.size > 0) {
			models = this.plugin.settings.models;
		} else {
			["gpt-3.5-turbo"].forEach(e => models.set(e, ''));
			this.plugin.settings.models = models;
			this.plugin.saveSettings();
		}
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h1', { text: 'Weaver Plugin Settings' });
		
		containerEl.createEl('h2', {
			text: 'OpenAI Settings'
		});

		// API Key
		let inputEl;
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('You need to create an OpenAI account to generate an API Key.')
			.addText(text => text
				.setPlaceholder('Enter your API Key')
				.setValue(this.plugin.settings.api_key)
				.onChange(async (value) => {
					this.plugin.settings.api_key = value;
					await this.plugin.saveSettings();
				})
				.then((textEl) => {
					inputEl = textEl
				})
				.inputEl.setAttribute('type', 'password')
			)

		// Models
		let models = new Map();
		models = this.plugin.settings.models;

		new Setting(containerEl)
			.setName('Model')
			.setDesc('The model setting allows you to choose which OpenAI model the chat view should be using.')
			.addDropdown((cb) => {
				models.forEach((value, key) => {
					cb.addOption(key, key);

				})
				cb.setValue(this.plugin.settings.engine);
				cb.onChange(async (value) => {
					this.plugin.settings.engine = value;
					await this.plugin.saveSettings();
				});
			})
		
		// Engine Settinhgs
		containerEl.createEl('h2', {
			text: 'Model Configuration Settings'
		});

		// Tockens
		new Setting(containerEl)
			.setName('Maximum Tokens')
			.setDesc('The maximum number of tokens that will be generated as a response (1000 tokens ~ 750 words).')
			.addText(text => text
				.setValue(this.plugin.settings.max_tokens.toString())
				.onChange(async (value) => {
					this.plugin.settings.max_tokens = parseInt(value);
					await this.plugin.saveSettings();
				}));
		
		// Temperature
		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Controls the randomness of the generated text.')
			.addText(text => text
				.setValue(this.plugin.settings.temperature.toString())
				.onChange(async (value) => {
					this.plugin.settings.temperature = parseFloat(value);
					await this.plugin.saveSettings();
				}));

		// Frequency Penality
		new Setting(containerEl)
			.setName('Frequency Penalty')
			.setDesc('Controls the repetition of the generated text.')
			.addText(text => text
				.setValue(this.plugin.settings.frequency_penalty.toString())
				.onChange(async (value) => {
					this.plugin.settings.frequency_penalty = parseFloat(value);
					await this.plugin.saveSettings();
				})
			);
	}
}
