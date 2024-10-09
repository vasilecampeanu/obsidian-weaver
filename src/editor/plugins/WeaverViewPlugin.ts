import { EditorView, PluginValue, ViewPlugin } from '@codemirror/view';
import Weaver from 'main';
import { debounce, TFile } from 'obsidian';

export interface SelectionChangedEventData {
	selectedText: string;
	sourceFile: TFile | null;
}

export class WeaverViewPlugin implements PluginValue {
	private plugin: Weaver;
	private view: EditorView;
	private lastSelection: { from: number; to: number } | null = null;
	private userSelectionEvent: () => void;

	constructor(view: EditorView, plugin: Weaver) {
		this.view = view;
		this.plugin = plugin;
		this.userSelectionEvent = debounce(this.handleUserSelection.bind(this), 300);
	}

	update(): void {
		this.userSelectionEvent();
	}

	private handleUserSelection(): void {
		const { state } = this.view;
		const { from, to } = state.selection.main;

		if (!this.lastSelection || this.lastSelection.from !== from || this.lastSelection.to !== to) {
			if (from !== to) {
				const selectedText = state.doc.sliceString(from, to);
				const sourceFile = this.plugin.app.workspace.getActiveFile();

				const eventData: SelectionChangedEventData = { selectedText, sourceFile };
				this.plugin.events.trigger('selection-changed', eventData);
			}

			this.lastSelection = { from, to };
		}
	}

	destroy(): void {
		// TODO: Perform any necessary cleanup here
	}
}

// Factory function to create the WeaverViewPlugin
export function createWeaverViewPlugin(plugin: Weaver) {
	return ViewPlugin.define((view: EditorView) => new WeaverViewPlugin(view, plugin));
}
