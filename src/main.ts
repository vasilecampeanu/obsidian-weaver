import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from './settings'
import { WEAVER_CHAT_VIEW_TYPE, WEAVER_THREADS_VIEW_TYPE } from './constants'

import { WeaverChatView } from './components/Chat/WeaverChatView';
import { WeaverThreadsView } from 'components/Threads/WeaverThreadsView';

import { ConversationHelper } from 'helpers/ConversationHelpers';

import { MetadataManager } from 'utils/MetadataManager';
import { ConversationBsonManager } from 'utils/ConversationBsonManager';
import { DescriptorManager } from 'utils/DescriptorManager';
import { ThreadsManager } from 'utils/ThreadsManager';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;
    public isRenamingFromInside: boolean = false;

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
		this.registerView(WEAVER_THREADS_VIEW_TYPE, (leaf) => new WeaverThreadsView(leaf, this));

		// Bind plugin components
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));

		// Sync external changes
		if ((await DescriptorManager.descriptorExists(this))) {
			await MetadataManager.syncDescriptorWithFileSystem(this);
		}
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
		const threads = await ThreadsManager.getThreads(this);
		this.settings.activeThread = threads[0].id;
	}

	private async initListeners() {
	}

	openWeaverChat = async () => {
		let leafs = this.app.workspace.getLeavesOfType(WEAVER_CHAT_VIEW_TYPE);

		if (leafs.length == 0) {
			let leaf = this.app.workspace.getRightLeaf(false);
			await leaf.setViewState({ type: WEAVER_CHAT_VIEW_TYPE });
			this.app.workspace.revealLeaf(leaf);
		} else {
			leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
		}
	};

	openWeaverThreads = async () => {
		let leafs = this.app.workspace.getLeavesOfType(WEAVER_THREADS_VIEW_TYPE);

		if (leafs.length == 0) {
			let leaf = this.app.workspace.getLeftLeaf(false);
			await leaf.setViewState({ type: WEAVER_THREADS_VIEW_TYPE });
			this.app.workspace.revealLeaf(leaf);
		} else {
			leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
		}
	};

	async onLayoutReady(): Promise<void> {
		// Load Wevaer when on Obsidian open
		if (this.settings.openOnStartUp) {
			this.openWeaverThreads();
		}

		// Load Wevaer when on Obsidian open
		if (this.settings.openOnStartUp) {
			this.openWeaverChat();
		}

		// Load Settings Tab
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Commands
		this.addCommand({
			id: "open-weaver-chat-view",
			name: "Open Chat View",
			callback: () => this.openWeaverChat(),
			hotkeys: []
		});

		this.addCommand({
			id: "open-weaver-threads-view",
			name: "Open Threads View",
			callback: () => this.openWeaverThreads(),
			hotkeys: []
		});

		// Ribbon Icon
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('git-branch-plus', 'Open weaver chat', (evt: MouseEvent) => {
			this.openWeaverChat();
			this.openWeaverThreads();
		});

		// Add a class
		ribbonIconEl.addClass('obsidian-weaver-ribbon-icon');

		// Register file Events
		this.registerEvent(
			this.app.vault.on('rename', async (file) => {
				if (file.path.endsWith(".bson") && !this.isRenamingFromInside) {
					const cleanedFilePath = file.path.replace(/^bins\/weaver\//, '');
					await ConversationBsonManager.renameConversationByFilePath(this, cleanedFilePath);
				}
			})
		);		

		this.registerEvent(
			this.app.vault.on('delete', async (file) => {
				if (file.path.endsWith(".bson") && !this.isRenamingFromInside) {
					const cleanedFilePath = file.path.replace(/^bins\/weaver\//, '');
					await ConversationBsonManager.deleteConversationByFilePath(this, cleanedFilePath);
				}
			})
		);
	}
}
