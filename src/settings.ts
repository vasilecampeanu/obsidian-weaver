import { App, PluginSettingTab, Setting } from "obsidian";
import Weaver from "main";

export const DEFAULT_MODELS: Record<string, string> = {
	"gpt-3.5-turbo": "gpt-3.5-turbo",
	"gpt-4": "gpt-4"
};

export interface WeaverSettings {
    activeThreadId: number,
    activeThreadTitle: string | null,
    apiKey: string,
    engine: string,
    frequencyPenalty: number,
    maxTokens: number,
    models: any,
    openOnStartUp: boolean,
    showWelcomeMessage: boolean,
	stream: boolean,
    systemRolePrompt: string,
    temperature: number,
    weaverFolderPath: string,
	threadViewIdentationGuides: boolean,
	threadViewCompactMode: boolean
}

export const DEFAULT_SETTINGS: WeaverSettings = {
    activeThreadId: -1,
    activeThreadTitle: null,
    apiKey: "",
    engine: "gpt-3.5-turbo",
    frequencyPenalty: 0.5,
    maxTokens: 512,
    models: DEFAULT_MODELS,
    openOnStartUp: true,
    showWelcomeMessage: true,
	stream: false,
    systemRolePrompt: "You are a personal knowledge management assistant designed to work within Obsidian, a popular note-taking and knowledge management tool. Your purpose is to help users organize, manage, and expand their knowledge base by providing well-structured, informative, and relevant responses. Please ensure that you format your responses using Markdown syntax, which is the default formatting language used in Obsidian. This includes, but is not limited to, using appropriate headers, lists, links and code blocks. In addition to Markdown, please utilize LaTeX formatting when necessary to render mathematical symbols and equations in a clear and concise manner. This includes, but is not limited to, using symbols such as $\alpha$, $\beta$, $\gamma$, $\delta$, and $\theta$ and equations like $f(x) = x^2 + 2x + 1$ and $\int_{0}^{\infty} e^{-x^2} dx$. For formulas that are on a single line, enclose the LaTeX code between four dollar signs ($$$$) Please ensure that you follow proper LaTeX syntax and formatting guidelines to ensure the readability and coherence of your responses.",
    temperature: 0.7,
    weaverFolderPath: "bins/weaver",
	threadViewIdentationGuides: true,
	threadViewCompactMode: false
};

export class WeaverSettingTab extends PluginSettingTab {
	public app: App;
	private readonly plugin: Weaver;

	constructor(app: App, plugin: Weaver) {
		super(app, plugin);

		this.app = app;
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h1', { text: 'Weaver Settings' });

		containerEl.createEl('h2', {
			text: 'OpenAI'
		});

		let inputEl;
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('In order to generate an API Key, you must first create an OpenAI account.')
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

		let models: Record<string, string> = this.plugin.settings.models;

		new Setting(containerEl)
			.setName('Model')
			.setDesc('This allows you to choose which model the chat view should utilize..')
			.addDropdown((cb) => {
				Object.entries(models).forEach(([key, value]) => {
					cb.addOption(key, value);
				});
				cb.setValue(this.plugin.settings.engine);
				cb.onChange(async (value) => {
					this.plugin.settings.engine = value;
					await this.plugin.saveSettings();
				});
			})

		containerEl.createEl('h2', { text: 'Model Configuration' });

		new Setting(containerEl)
			.setName('System Role Prompt')
			.setDesc('This setting determines the behavior of the assistant.')
			.addText(text => text
				.setValue(this.plugin.settings.systemRolePrompt)
				.onChange(async (value) => {
					this.plugin.settings.systemRolePrompt = value;
					await this.plugin.saveSettings();
				})
				.inputEl.setAttribute('size', '50')
			)

		new Setting(containerEl)
			.setName('Maximum Tokens')
			.setDesc('This represents the maximum number of tokens that will be generated as a response (1000 tokens ~ 750 words).')
			.addText(text => text
				.setValue(this.plugin.settings.maxTokens.toString())
				.onChange(async (value) => {
					this.plugin.settings.maxTokens = parseInt(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Controls the randomness of the generated text.')
			.addText(text => text
				.setValue(this.plugin.settings.temperature.toString())
				.onChange(async (value) => {
					this.plugin.settings.temperature = parseFloat(value);
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Frequency Penalty')
			.setDesc('Controls the repetition of the generated text.')
			.addText(text => text
				.setValue(this.plugin.settings.frequencyPenalty.toString())
				.onChange(async (value) => {
					this.plugin.settings.frequencyPenalty = parseFloat(value);
					await this.plugin.saveSettings();
				})
			);

		containerEl.createEl('h2', { text: 'General' });

		new Setting(containerEl)
			.setName('Weaver Folder Path')
			.setDesc('This setting specifies the directory or path where the conversations are stored and saved.')
			.addText(text => text
				.setValue(this.plugin.settings.weaverFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.weaverFolderPath = value;
					await this.plugin.saveSettings();
				})
				.inputEl.setAttribute('size', '50')
			)

		new Setting(containerEl)
			.setName('Open on Startup')
			.setDesc('This determines whether the chat view will be automatically loaded when Obsidian starts up.')
			.addToggle(v => v
				.setValue(this.plugin.settings.openOnStartUp)
				.onChange(async (value) => {
					this.plugin.settings.openOnStartUp = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Insert Welcome Message')
			.setDesc('Controls whether or not a welcome message will be automatically added when a new chat session is created.')
			.addToggle(v => v
				.setValue(this.plugin.settings.showWelcomeMessage)
				.onChange(async (value) => {
					this.plugin.settings.showWelcomeMessage = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', { text: 'Interface' });
		containerEl.createEl('h3', { text: 'Thread View' });
		
		new Setting(containerEl)
			.setName('Identation Guides')
			.setDesc('Display identation guides.')
			.addToggle(v => v
				.setValue(this.plugin.settings.threadViewIdentationGuides)
				.onChange(async (value) => {
					this.plugin.settings.threadViewIdentationGuides = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('Compact Mode')
			.setDesc('Show only the title of the conversation.')
			.addToggle(v => v
				.setValue(this.plugin.settings.threadViewCompactMode)
				.onChange(async (value) => {
					this.plugin.settings.threadViewCompactMode = value;
					await this.plugin.saveSettings();
				}));
	}
}
