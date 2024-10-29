import { readJsonFile, writeJsonFile } from 'helpers/FileIOUtils';
import Weaver from 'main';
import { Events, FileSystemAdapter, TFile } from 'obsidian';
import * as path from 'path';

export interface RecentItem {
	type: string;
	timestamp: number;
}

export interface RecentFileItem extends RecentItem {
	type: 'file';
	path: string;
	basename: string;
	extension: string;
}

export default class RecentItemsManager extends Events {
	private plugin: Weaver;
	public recentItems: RecentItem[];
	private adapter: FileSystemAdapter;
	private dataFilePath: string;

	constructor(plugin: Weaver) {
		super();

		this.plugin = plugin;
		this.recentItems = [];

		const adapter = this.plugin.app.vault.adapter;

		if (adapter instanceof FileSystemAdapter) {
			this.adapter = adapter;
			this.dataFilePath = path.join('.weaver', 'recent-items.json');
		} else {
			throw new Error('Cannot get FileSystemAdapter');
		}
	}

	public async load(): Promise<void> {
		const dir = path.dirname(this.dataFilePath);
		const exists = await this.adapter.exists(dir);

		if (!exists) {
			try {
				await this.adapter.mkdir(dir);
			} catch (error) {
				console.error('Failed to create .weaver directory:', error);
				return;
			}
		}

		try {
			const data = await readJsonFile<RecentItem[]>(this.adapter, this.dataFilePath);
			this.recentItems = data || [];
		} catch (error) {
			console.error('Failed to load recent items:', error);
			this.recentItems = [];
		}
	}

	public async save(): Promise<void> {
		try {
			await writeJsonFile(this.adapter, this.dataFilePath, this.recentItems);
		} catch (error) {
			console.error('Failed to save recent items:', error);
		}
	}

	public async addItem(item: RecentItem): Promise<void> {
		this.recentItems = this.recentItems.filter(
			(existingItem) =>
				!(existingItem.type === item.type && this.isSameItem(existingItem, item))
		);

		this.recentItems.unshift(item);

		const maxLength = this.plugin.settings.maxRecentItems || 50;
		if (this.recentItems.length > maxLength) {
			this.recentItems = this.recentItems.slice(0, maxLength);
		}

		await this.save();
		this.trigger('recent-items-updated');
	}

	private isSameItem(item1: RecentItem, item2: RecentItem): boolean {
		if (item1.type !== item2.type) return false;
		switch (item1.type) {
			case 'file':
				return (item1 as RecentFileItem).path === (item2 as RecentFileItem).path;
			default:
				return false;
		}
	}

	public async onFileOpen(file: TFile): Promise<void> {
		if (!file || !this.shouldAddFile(file)) return;

		const recentFileItem: RecentFileItem = {
			type: 'file',
			path: file.path,
			basename: file.basename,
			timestamp: Date.now() / 1000,
			extension: file.extension,
		};

		await this.addItem(recentFileItem);
	}

	public async onFileRename(file: TFile, oldPath: string): Promise<void> {
		const index = this.recentItems.findIndex(
			(item) => item.type === 'file' && (item as RecentFileItem).path === oldPath
		);

		if (index !== -1) {
			const recentFileItem = this.recentItems[index] as RecentFileItem;
			recentFileItem.path = file.path;
			recentFileItem.basename = file.basename;
			await this.save();
			this.trigger('recent-items-updated');
		}
	}

	public async onFileDelete(file: TFile): Promise<void> {
		const beforeLength = this.recentItems.length;
		this.recentItems = this.recentItems.filter(
			(item) => !(item.type === 'file' && (item as RecentFileItem).path === file.path)
		);

		if (this.recentItems.length !== beforeLength) {
			await this.save();
			this.trigger('recent-items-updated');
		}
	}

	private shouldAddFile(file: TFile): boolean {
		return true;
	}

	public async onItemRename(oldItem: RecentItem, newItem: RecentItem): Promise<void> {
		const index = this.recentItems.findIndex((item) => this.isSameItem(item, oldItem));

		if (index !== -1) {
			this.recentItems[index] = newItem;
			await this.save();
			this.trigger('recent-items-updated');
		}
	}

	public async onItemDelete(itemToDelete: RecentItem): Promise<void> {
		const beforeLength = this.recentItems.length;
		this.recentItems = this.recentItems.filter(
			(item) => !this.isSameItem(item, itemToDelete)
		);

		if (this.recentItems.length !== beforeLength) {
			await this.save();
			this.trigger('recent-items-updated');
		}
	}
}
