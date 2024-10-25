import { EChatModels } from "enums/EProviders";
import Weaver from "main";
import { App, PluginSettingTab, Setting, TextComponent } from "obsidian";

export interface WeaverSettings {
	apiKey: string,
	weaverDirectory: string,
	weaverContextStorage: string,
	loadLastConversation: boolean,
	model: EChatModels,
	systemPrompt: string,
	openOnStartup: boolean,
	sendSelectionToChat: boolean,
	enableCharacterCounter: boolean,
	enableWordCounter: boolean
}

export const DEFAULT_SETTINGS: WeaverSettings = {
	apiKey: "",
	weaverDirectory: ".weaver",
	get weaverContextStorage() {
		return `${this.weaverDirectory}/context.json`;
	},
	loadLastConversation: true,
	model: EChatModels.GPT_4o,
	systemPrompt: 'As an AI assistant integrated with Obsidian.md, provide responses formatted in Markdown. Use $ ... $ for inline LaTeX and $$ ... $$ on separate lines for block LaTeX.',
	openOnStartup: true,
	sendSelectionToChat: false,
	enableWordCounter: false,
	enableCharacterCounter: true,
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

		containerEl.createEl('h2', { text: 'General' });

		new Setting(containerEl)
			.setName('Open Weaver on Startup')
			.setDesc('Automatically open the Weaver view when Obsidian starts.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.openOnStartup)
				.onChange(async (value) => {
					this.plugin.settings.openOnStartup = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Enable Word Counter')
			.setDesc('Toggle the display of the word counter in the chat input area.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableWordCounter)
				.onChange(async (value) => {
					this.plugin.settings.enableWordCounter = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Enable Character Counter')
			.setDesc('Toggle the display of the character counter in the chat input area.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableCharacterCounter)
				.onChange(async (value) => {
					this.plugin.settings.enableCharacterCounter = value;
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl('h2', {
			text: 'OpenAI'
		});

		let inputEl: TextComponent;
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Enter your OpenAI API Key to enable AI functionalities. You can obtain an API Key from your OpenAI account.')
			.addText(text => text
				.setPlaceholder('sk-XXXXXXXXXXXXXXXXXXXX')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value.trim();
					await this.plugin.saveSettings();
				})
				.then((textEl) => {
					inputEl = textEl;
				})
				.inputEl.setAttribute('type', 'password')
			);

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Select the default AI model for new chat conversations.')
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

		containerEl.createEl('h2', {
			text: 'Model Configuration'
		});

		new Setting(containerEl)
			.setName('System Prompt')
			.setDesc('Define the initial instructions or context for the AI assistant. This prompt will guide the behavior and responses of the model.')
			.addTextArea(text => text
				.setPlaceholder('e.g., "You are a helpful assistant that summarizes markdown notes."')
				.setValue(this.plugin.settings.systemPrompt)
				.onChange(async (value) => {
					this.plugin.settings.systemPrompt = value;
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl('h2', {
			text: 'Experimental'
		});

		new Setting(containerEl)
			.setName('Send Selection to Chat')
			.setDesc('When in editing mode, send the selected text to the chat interface for context.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.sendSelectionToChat)
				.onChange(async (value) => {
					this.plugin.settings.sendSelectionToChat = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
