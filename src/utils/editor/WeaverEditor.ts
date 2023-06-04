import { PluginValue, EditorView, ViewPlugin } from "@codemirror/view";
import { eventEmitter } from "utils/EventEmitter";
import Weaver from "main";

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

			// Emit the selected text.
			eventEmitter.emit("textSelected", selectedText);
		}
	}

	addPlugin(plugin: Weaver) {
		this.plugin = plugin;
		this.update();
	}
}

export const weaverEditor = ViewPlugin.fromClass(WeaverEditor);
