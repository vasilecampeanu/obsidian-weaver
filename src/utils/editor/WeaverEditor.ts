import { PluginValue, EditorView, ViewPlugin } from "@codemirror/view";
import Weaver from "main";
import { MarkdownView } from "obsidian";

class WeaverEditor implements PluginValue {
	private view: EditorView;
	private plugin: Weaver;

	constructor(view: EditorView) {
		this.view = view;
	}

	update(): void {
		const { state } = this.view;
		const { from, to } = state.selection.main;
		
		// Only extract the selected text if something is selected.
		if (from !== to) {
			const selectedText = state.doc.sliceString(from, to);
	
			// Display the selected text.
			console.log(selectedText);
		}
	}	
	
	addPlugin(plugin: Weaver) {
		this.plugin = plugin;
		this.update();
	}	
}

export const weaverEditor = ViewPlugin.fromClass(WeaverEditor);
