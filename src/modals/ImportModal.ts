import { FuzzyMatch, FuzzySuggestModal, MetadataCache, Notice, TFile, TFolder, Vault } from 'obsidian';

import WeaverPlugin from 'main';
import { WeaverImporter } from 'utils/WeaverImporter';

const JSON_FORMATS = ['json'];

export default class LocalJsonModal extends FuzzySuggestModal<TFile> {
	plugin: WeaverPlugin;
	vault: Vault;
	metadataCache: MetadataCache;

	constructor(plugin: WeaverPlugin) {
		super(plugin.app);

		this.plugin = plugin;
		this.vault = plugin.app.vault;
		this.metadataCache = plugin.app.metadataCache;

		this.containerEl.addClass('weaver-local-json-modal');
		this.setPlaceholder('Pick a json file to import conversations');
	}

	getItems(): TFile[] {
		return this.vault.getFiles().filter(f => JSON_FORMATS.includes(f.extension));
	}

	getItemText(item: TFile): string {
		return item.path;
	}

	renderSuggestion(match: FuzzyMatch<TFile>, el: HTMLElement) {
		super.renderSuggestion(match, el);
		el.addClass('weaver-suggestion-item');
	}

	async onChooseItem(jsonFile: TFile) {
		const exportPath = jsonFile.path; // Here's the correction
		const conversationsFolderPath = this.plugin.settings.weaverFolderPath + "/threads/base";
		await WeaverImporter.importConversations(this.plugin, exportPath, conversationsFolderPath);
	}
}
