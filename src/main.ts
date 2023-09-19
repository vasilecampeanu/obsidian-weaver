import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, addIcon } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { WeaverSettings } from 'interfaces/WeaverSettings';
import { SampleSettingTab, DEFAULT_SETTINGS } from 'settings';
import { weaverEditor } from 'plugins/WeaverEditor';
import { WeaverThreadView } from 'views/WeaverThreadView';

export default class Weaver extends Plugin {
	public settings: WeaverSettings;

	async onload() {
		await this.messageOnLoad();
		await this.loadSettings();
		await this.loadResources();
		this.registerEditorExtension(weaverEditor);
		await this.registerEventListeners();
		this.registerView('weaver-thread-view', (leaf: WorkspaceLeaf) => new WeaverThreadView(leaf, this));
		this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
	}

	async messageOnLoad() {
		console.log('obsidian-weaver loading...');
	}

	async onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async loadResources() {
		addIcon('needle', `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M 15.324 2 C 15.052 2 14.844 2.207 14.844 2.476 C 14.844 2.746 15.052 2.953 15.324 2.953 C 15.611 2.953 15.866 3.063 16.058 3.27 C 16.249 3.476 16.344 3.746 16.313 4.016 L 15.611 12.333 C 13.759 12.572 11.668 12.603 9.688 12.619 C 5.746 12.651 2.617 12.683 2.09 14.428 C 1.628 15.937 2.952 17.667 6.097 19.714 C 6.177 19.762 6.273 19.793 6.353 19.793 C 6.512 19.793 6.656 19.714 6.752 19.572 C 6.895 19.349 6.831 19.063 6.608 18.905 C 3.256 16.714 2.793 15.413 3.016 14.698 C 3.335 13.635 6.719 13.603 9.72 13.572 C 11.652 13.556 13.695 13.523 15.547 13.302 L 15.259 16.651 C 15.164 16.588 15.052 16.539 14.924 16.555 C 14.653 16.572 14.461 16.809 14.494 17.063 L 14.86 21.397 C 14.876 21.619 15.068 21.809 15.291 21.825 L 15.339 21.825 C 15.579 21.825 15.802 21.635 15.818 21.397 L 16.52 13.143 C 18.372 12.825 19.969 12.238 20.958 11.158 C 21.756 10.286 22.091 9.174 21.979 7.825 C 21.884 6.651 21.245 5.603 20.192 4.873 C 19.378 4.302 18.324 3.968 17.303 3.889 C 17.287 3.413 17.111 2.953 16.776 2.603 C 16.393 2.223 15.866 2 15.324 2 Z M 14.781 4.208 C 14.749 4.209 14.717 4.214 14.685 4.223 C 11.109 5.207 5.953 5.476 3.239 5.175 C 2.984 5.143 2.745 5.333 2.713 5.588 C 2.681 5.841 2.873 6.079 3.128 6.111 C 3.878 6.191 4.772 6.238 5.778 6.238 C 8.603 6.238 12.163 5.889 14.94 5.143 C 15.195 5.079 15.339 4.809 15.275 4.555 C 15.219 4.333 15.004 4.196 14.781 4.208 Z M 17.207 4.858 C 19.011 4.968 20.862 6.095 21.006 7.921 C 21.102 9.016 20.846 9.873 20.224 10.54 C 19.442 11.397 18.133 11.888 16.584 12.19 L 17.207 4.858 Z M 14.145 6.284 C 14.114 6.282 14.08 6.282 14.046 6.286 C 13.775 6.302 13.584 6.539 13.615 6.793 L 13.967 10.921 C 13.983 11.174 14.19 11.365 14.445 11.365 L 14.494 11.365 C 14.764 11.349 14.956 11.111 14.924 10.858 L 14.573 6.73 C 14.545 6.494 14.37 6.307 14.145 6.284 Z M 8.963 20.386 C 8.809 20.399 8.667 20.486 8.587 20.635 C 8.459 20.873 8.539 21.158 8.778 21.286 C 9.178 21.492 9.608 21.714 10.056 21.953 C 10.119 21.984 10.199 22 10.279 22 C 10.454 22 10.614 21.905 10.71 21.746 C 10.838 21.508 10.742 21.223 10.503 21.111 C 10.072 20.889 9.641 20.667 9.242 20.444 C 9.152 20.397 9.055 20.378 8.963 20.386 Z"/></svg>`);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async getSelection(leaf: WorkspaceLeaf): Promise<void> {
		// @ts-expect-error
		const editor = leaf?.view?.editor;

		if (editor) {
			const editorView = editor.cm as EditorView;
			const editorPlugin = editorView.plugin(weaverEditor);
			editorPlugin?.addPlugin(this);
			editorPlugin?.update();
		}
	}

	private async registerEventListeners(): Promise<void> {
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', async (leaf: WorkspaceLeaf) => {
				this.getSelection(leaf);
			})
		);
	}

	private async openWeaverThreadView() {
		const leafs = this.app.workspace.getLeavesOfType('weaver-thread-view');
		
		if (leafs.length == 0) {
			const leaf = this.app.workspace.getRightLeaf(false);
			await leaf.setViewState({ type: 'weaver-thread-view' });
			this.app.workspace.revealLeaf(leaf);
		} else {
			leafs.forEach((leaf) => this.app.workspace.revealLeaf(leaf));
		}
	}

	private async onLayoutReady(): Promise<void> {
		this.openWeaverThreadView();
		this.getSelection(this.app.workspace.getMostRecentLeaf() as WorkspaceLeaf);
	}
}
