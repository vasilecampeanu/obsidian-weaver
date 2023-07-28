import { App, PluginSettingTab, Setting } from "obsidian";
import Weaver from "main";

export const DEFAULT_MODELS: Record<string, string> = {
	"gpt-3.5-turbo": "gpt-3.5-turbo",
	"gpt-3.5-turbo-16k": "gpt-3.5-turbo-16k",
	"gpt-4": "gpt-4"
};

export const DEFAULT_MAX_TOKENS: Record<string, number> = {
	"GPT 3.5": 4096,
	"GPT 3.5 16k": 16000,
	"GPT 4": 32768
};

export interface WeaverSettings {
    activeThreadId: number,
    activeThreadTitle: string | null,
    apiKey: string,
    engine: string,
	engineInfo: boolean,
    frequencyPenalty: number,
    maxTokens: number,
    models: string,
    openOnStartUp: boolean,
	stream: boolean,
    systemRolePrompt: string,
    creativeSystemRolePrompt: string,
    balancedSystemRolePrompt: string,
    preciseSystemRolePrompt: string,
    temperature: number,
    weaverFolderPath: string,
	threadViewIdentationGuides: boolean,
	threadViewCompactMode: boolean,
	lastConversationId: string,
	loadLastConversationState: boolean,
	loadLastConversation: boolean
}

export const DEFAULT_SETTINGS: WeaverSettings = {
    activeThreadId: -1,
    activeThreadTitle: null,
    apiKey: "",
    engine: "gpt-3.5-turbo",
	engineInfo: true,
    frequencyPenalty: 0.5,
    maxTokens: 4096,
    models: DEFAULT_MODELS.gpt35Turbo,
    openOnStartUp: true,
	stream: false,
    systemRolePrompt: "You are a balanced personal knowledge management assistant designed to provide support within Obsidian, a favored note-taking and knowledge management platform. Your task is to provide medium-length responses that are equally informative, relevant, and organized. You should format your responses using Markdown syntax, which includes appropriate use of headers, lists, links, and code blocks. When needed, utilize LaTeX formatting to represent mathematical symbols and equations, such as $alpha$, $\beta$, $gamma$, $delta$, and $\theta$ and equations like $f(x) = x^2 + 2x + 1$ and $int_{0}^{infty} e^{-x^2} dx$. Enclose single line formulas in four dollar signs ($$$$). Strive to achieve a balance between exactness and creativity while maintaining the readability of your responses through proper LaTeX and Markdown syntax.",
    creativeSystemRolePrompt: "You are a creative personal knowledge management assistant designed to flourish within Obsidian, a leading note-taking and knowledge management ecosystem. Your mission is to generate the longest, most imaginative responses that help users expand their knowledge base in novel ways. Format your responses using Markdown syntax, which includes the use of headers, lists, links, and code blocks. When depicting mathematical symbols and equations, use LaTeX formatting to paint a clear picture. This includes symbols such as $alpha$, $\beta$, $gamma$, $delta$, and $\theta$ and equations like $f(x) = x^2 + 2x + 1$ and $int_{0}^{infty} e^{-x^2} dx$. For single line formulas, enclose the LaTeX code between four dollar signs ($$$$). Infuse creativity into your responses while upholding the integrity of LaTeX and Markdown syntax.",
    balancedSystemRolePrompt: "You are a balanced personal knowledge management assistant designed to provide support within Obsidian, a favored note-taking and knowledge management platform. Your task is to provide medium-length responses that are equally informative, relevant, and organized. You should format your responses using Markdown syntax, which includes appropriate use of headers, lists, links, and code blocks. When needed, utilize LaTeX formatting to represent mathematical symbols and equations, such as $alpha$, $\beta$, $gamma$, $delta$, and $\theta$ and equations like $f(x) = x^2 + 2x + 1$ and $int_{0}^{infty} e^{-x^2} dx$. Enclose single line formulas in four dollar signs ($$$$). Strive to achieve a balance between exactness and creativity while maintaining the readability of your responses through proper LaTeX and Markdown syntax.",
    preciseSystemRolePrompt: "You are a precision-oriented personal knowledge management assistant, designed to operate within Obsidian, a renowned note-taking and knowledge management software. Your role is to deliver the shortest, most accurate, and relevant responses that streamline users' knowledge bases. Format your responses using Markdown syntax, including headers, lists, links, and code blocks. When necessary, use LaTeX formatting to precisely represent mathematical symbols and equations, such as $alpha$, $\beta$, $gamma$, $delta$, and $\theta$ and equations like $f(x) = x^2 + 2x + 1$ and $int_{0}^{infty} e^{-x^2} dx$. Encase single line formulas in four dollar signs ($$$$). Aim to ensure absolute precision in your responses, maintaining strict adherence to LaTeX and Markdown syntax.",
    temperature: 0.7,
    weaverFolderPath: "bins/weaver",
	threadViewIdentationGuides: true,
	threadViewCompactMode: false,
	lastConversationId: "",
	loadLastConversationState: true,
	loadLastConversation: true
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
				.inputEl.setAttribute('type', 'password')
			)

		const models: string = this.plugin.settings.models;

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
			.setName('Creative System Role Prompt')
			.setDesc('This setting determines the behavior of the assistant in creative mode.')
			.addTextArea(text => text
				.setValue(this.plugin.settings.creativeSystemRolePrompt)
				.onChange(async (value) => {
					this.plugin.settings.creativeSystemRolePrompt = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName('Balanced System Role Prompt')
			.setDesc('This setting determines the behavior of the assistant in balanced mode.')
			.addTextArea(text => text
				.setValue(this.plugin.settings.balancedSystemRolePrompt)
				.onChange(async (value) => {
					this.plugin.settings.systemRolePrompt = value;
					this.plugin.settings.balancedSystemRolePrompt = value;
					await this.plugin.saveSettings();
				})
			)

		new Setting(containerEl)
			.setName('Precise System Role Prompt')
			.setDesc('This setting determines the behavior of the assistant in precise mode.')
			.addTextArea(text => text
				.setValue(this.plugin.settings.preciseSystemRolePrompt)
				.onChange(async (value) => {
					this.plugin.settings.preciseSystemRolePrompt = value;
					await this.plugin.saveSettings();
				})
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
			.setName('Load Last Selectd Conversation')
			.setDesc('Loads by default the last conversation you have used.')
			.addToggle(v => v
				.setValue(this.plugin.settings.loadLastConversation)
				.onChange(async (value) => {
					this.plugin.settings.loadLastConversation = value;
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
