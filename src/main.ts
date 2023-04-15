import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from './settings'
import { WEAVER_CHAT_VIEW_TYPE } from './constants'

import { WeaverChatView } from './components/Chat/WeaverChatView';
import { ConversationHelper } from 'helpers/ConversationHelpers';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;

	async onload() {
		// Display a message when loading
		console.log('obsidian-weaver loading...');

		// Load Settings
		await this.loadSettings();

		// States
		await this.initStates();

		// Init listeners
		this.initListeners();

		// Register Views
		this.registerView(WEAVER_CHAT_VIEW_TYPE, (leaf) => new WeaverChatView(leaf, this));

		// Bind plugin components
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
	}

	onunload() {
		new Notice(`Weaver Disabled`);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async initStates() {
	}

	private async initListeners() {
	}

	openWeaver = async () => {
		let leafs = this.app.workspace.getLeavesOfType(WEAVER_CHAT_VIEW_TYPE);

		if (leafs.length == 0) {
			let leaf = this.app.workspace.getRightLeaf(false);
			await leaf.setViewState({ type: WEAVER_CHAT_VIEW_TYPE });
			this.app.workspace.revealLeaf(leaf);
		} else {
			leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
		}
	};

	async onLayoutReady(): Promise<void> {
		// Load Wevaer when on Obsidian open
		if (this.settings.openOnStartUp) {
			this.openWeaver();
		}

		// Load Settings Tab
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Commands
		this.addCommand({
			id: "open-weaver-chat-view",
			name: "Open Chat View",
			callback: () => this.openWeaver(),
			hotkeys: []
		});

		// Ribbon Icon
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('git-branch-plus', 'Open weaver chat', (evt: MouseEvent) => {
			this.openWeaver()
		});

		// Add a class
		ribbonIconEl.addClass('obsidian-weaver-ribbon-icon');

		// Register file Events
		// TODO: Handle file delete and rename from the file explorer

		this.registerEvent(
			this.app.vault.on('rename', async (file) => {
				console.log(file.path)
				if (file.path.endsWith(".bson")) {
					await ConversationHelper.renameConversationByFilePath(this, file.path);
				}
			})
			);
			
			this.registerEvent(
				this.app.vault.on('delete', async (file) => {
				console.log(file.path)
				if (file.path.endsWith(".bson")) {
					await ConversationHelper.deleteConversationByFilePath(this, file.path);
				}
			})
		);
	}
}
