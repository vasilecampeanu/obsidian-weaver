import { createWeaverViewPlugin, SelectionChangedEventData } from 'editor/plugins/WeaverViewPlugin';
import { EventRef, Events, Plugin, WorkspaceLeaf } from 'obsidian';
import { DEFAULT_SETTINGS, WeaverSettings, WeaverSettingTab } from 'settings';
import { VIEW_WEAVER, WeaverView } from 'views/WeaverView';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;
	public events: Events;

	// Event refs
	private selectionChangedEventRef: EventRef | null = null;

	public async onload() {
		// Load settings early
		await this.loadSettings();
		this.addSettingTab(new WeaverSettingTab(this.app, this));

		// Create new instance of Events class for custom events
		this.events = new Events();

		// Register the Weaver view
		this.registerView(
			VIEW_WEAVER, 
			(leaf) => new WeaverView(leaf, this)
		);

		// Register the Editor Extension and pass the custom Events instance
		this.registerEditorExtension(createWeaverViewPlugin(this));

		// Register event listeners for custom events
		this.registerEventListeners();

		// Register plugin commands
		this.registerCommands();
	}

	public async onunload() {
		// Cleanup custom event listeners
		if (this.selectionChangedEventRef) {
			this.events.offref(this.selectionChangedEventRef);
		}

		// Detach all Weaver views
		this.app.workspace.detachLeavesOfType(VIEW_WEAVER);
	}

	private async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	public async saveSettings() {
		await this.saveData(this.settings);
	}

	private registerEventListeners(): void {
		// Listen to the 'selection-changed' custom event emitted by WeaverViewPlugin
		this.selectionChangedEventRef = this.events.on('selection-changed', this.handleSelectionChanged);
	}

	private handleSelectionChanged = (event: SelectionChangedEventData) => {
		const { selectedText, sourceFile } = event;
		console.log('Selection changed:', selectedText, sourceFile);

		// TODO: Implement your logic here, e.g., update Weaver view or process the selected text
		// this.updateWeaverView(selectedText, sourceFile);
	};

	private registerCommands() {
		this.addCommand({
			id: 'open-weaver-view',
			name: 'Open Weaver',
			callback: () => this.activateView(),
		});
	}

	public async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const existingLeaves = workspace.getLeavesOfType(VIEW_WEAVER);

		if (existingLeaves.length > 0) {
			leaf = existingLeaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_WEAVER, active: true });
		}

		workspace.revealLeaf(leaf!);
	}
}
