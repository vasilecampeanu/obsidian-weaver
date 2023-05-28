import { FileSystemAdapter, Notice, Plugin, Workspace } from 'obsidian';
import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from './settings';
import { WEAVER_THREAD_VIEW } from './constants';
import { FileIOManager } from 'utils/FileIOManager';
import { WeaverThreadView } from 'views/WeaverThreadView';
import { WeaverImporter } from 'utils/WeaverImporter';
import { ThreadManager } from 'utils/ThreadManager';
import { WeaverHealthManager } from 'utils/WeaverHealthManager';
import { eventEmitter } from 'utils/EventEmitter';
import LocalJsonModal from 'modals/ImportModal';
import { MigrationAssistant } from 'utils/MigrationAssistant';
import { ConversationManager } from 'utils/ConversationManager';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;
	public workspace: Workspace;
	public isRenamingFromInside: boolean = false;

	async onload() {
		// Loading message
		await this.messageOnLoad();

		// Settings
		await this.loadSettings();

		// Listeners
		await this.registerEventListeners();

		// Register views
		this.registerView(WEAVER_THREAD_VIEW, (leaf) => new WeaverThreadView(leaf, this));

		// Bind user interface elements
		await this.registerUserInteractions();
			
		// Bind plugin components
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));

		// Weaver health
		await this.ensureWeaverHealth();
	}	

	async onunload() {
		new Notice('Weaver disabled!');
	}

	async messageOnLoad() {
		console.log('obsidian-weaver loading...');
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async ensureWeaverHealth() {
		setTimeout(async () => {	
			// Ensure the folder exists
			await FileIOManager.ensureWeaverFolderPathExists(this);
			await FileIOManager.ensureFolderPathExists(this, "threads/base");

			// Check for external renames in the background
			// await WeaverHealthManager.checkForExternalRename(this);

			// Check for legacy data
			await MigrationAssistant.migrateData(this);

			if (this.settings.systemRolePrompt !== this.settings.balancedSystemRolePrompt) {
				this.settings.systemRolePrompt = this.settings.balancedSystemRolePrompt;
				this.saveSettings();
			}

			// Refresh thread view
			eventEmitter.emit('reloadThreadViewEvent');
		}, 500);
	}

	private async registerEventListeners() {
		this.registerEvent(
			this.app.vault.on('rename', async (item, oldPath) => {
				// Check if the path has an extension
				const hasExtension = /\.[^/.]+$/;

				// Check if the path contains "bins/weaver"
				if (item.path.startsWith(this.settings.weaverFolderPath) && !this.isRenamingFromInside) {
					if (item.path.endsWith(".json")) {
						// Extract the new title from the new file name (assuming it is the file name without the extension)
						const newFileName = item.path.split('/').pop() ?? '';
						const newTitle = newFileName.replace('.json', '');

						// Update the conversation title
						await ConversationManager.updateConversationTitleByPath(this, item.path, newTitle);

						// Reload thread thread view
						eventEmitter.emit('reloadThreadViewEvent');
					}
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', async (item) => {
				// Check if the path has an extension
				const hasExtension = /\.[^/.]+$/;

				// Check if the path contains "bins/weaver"
				if (item.path.startsWith(this.settings.weaverFolderPath) && !this.isRenamingFromInside) {
					if (item.path.endsWith(".json")) {
						// Reload thread thread view
						eventEmitter.emit('reloadThreadViewEvent');
					}
				}
			})
		);
	}

	private async openWeaverThreadView() {
		let leafs = this.app.workspace.getLeavesOfType(WEAVER_THREAD_VIEW);

		if (leafs.length == 0) {
			let leaf = this.app.workspace.getRightLeaf(false);
			await leaf.setViewState({ type: WEAVER_THREAD_VIEW });
			this.app.workspace.revealLeaf(leaf);
		} else {
			leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
		}
	}

	private registerCommands() {
		this.addCommand({
			id: 'open-weaver-thread-view',
			name: 'Open Thread View',
			callback: () => this.openWeaverThreadView(),
			hotkeys: [],
		});

		this.addCommand({
			id: 'weaver:importConversations',
			name: 'Import conversations from local JSON',
			checkCallback: (checking) => {
				if (checking) { return true; }
				new LocalJsonModal(this).open();
			}
		});
	}

	private registerRibbonIcons() {
		const ribbonIconEl = this.addRibbonIcon(
			'git-branch-plus',
			'Open weaver thread',
			(evt: MouseEvent) => {
				this.openWeaverThreadView();
			},
		);

		ribbonIconEl.addClass('obsidian-weaver-ribbon-icon');
	}

	private async registerUserInteractions() {
		this.registerCommands();
		this.registerRibbonIcons();
	}

	private async onLayoutReady(): Promise<void> {
		if (this.settings.openOnStartUp) {
			this.openWeaverThreadView();
		}

		this.addSettingTab(new WeaverSettingTab(this.app, this));
	}
}
