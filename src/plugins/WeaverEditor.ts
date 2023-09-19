import Weaver from 'main';
import { PluginValue, EditorView, ViewPlugin } from '@codemirror/view';
import { eventEmitter } from 'utils/EventEmitter';

class WeaverEditor implements PluginValue {
	private plugin: Weaver;
	private view: EditorView;
	private lastSelection: { from: number; to: number } | null = null;

	constructor(view: EditorView) {
		this.view = view;
		this.userSelectionEvent = this.debounce(this.userSelectionEvent.bind(this), 300);
	}

	update(): void {
		this.userSelectionEvent();
	}

	addPlugin(plugin: Weaver) {
		this.plugin = plugin;
		this.update();
	}

	userSelectionEvent(): void {
		const { state } = this.view;
		const { from, to } = state.selection.main;

		if (!this.lastSelection || this.lastSelection.from !== from || this.lastSelection.to !== to) {
			if (from !== to) {
				const selectedText = state.doc.sliceString(from, to);
				const sourceFile = this.plugin.app.workspace.getActiveFile();

				eventEmitter.emit('textSelected', {
					text: selectedText,
					file: sourceFile
				});
			}

			this.lastSelection = { from, to };
		}
	}

	debounce(fn: Function, delay: number) {
		let timer: any = null;

		return function (...args: any[]) {
			const context = this;

			if (timer) {
				clearTimeout(timer);
			}

			timer = setTimeout(() => {
				fn.apply(context, args);
			}, delay);
		};
	}
}

export const weaverEditor = ViewPlugin.fromClass(WeaverEditor);
