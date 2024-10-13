import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { ensureFoldersExist } from "utils/FileIOUtils";
import { DEFAULT_CONTEXT_STATES } from "./slices/store.slice.context";
import { WeaverStoreProps } from "./slices/store.slicemaster";
import { createWeaverStore, WeaverStore } from "./Store";

interface IStore {
	previousConversationId: string | null;
}

export class StoreService {
	private store: WeaverStore | null = null;

	constructor(private plugin: Weaver) {}

	/**
	 * Initializes the Zustand store with hydration data and sets up persistence.
	 */
	public async initializeStore(): Promise<void> {
		await this.ensureLocalStorage();

		const hydration = await this.hydrateStore();
		this.store = createWeaverStore(this.plugin, hydration);

		// Subscribe to store changes to persist data automatically
		this.store.subscribe((state) => {
			// Subscribe to chnages
		});
	}

	/**
	 * Ensures that the local storage schema (folder structure) exists.
	 * Creates necessary folders if they do not exist.
	 */
	private async ensureLocalStorage(): Promise<void> {
		const weaverDirectory = this.plugin.settings.weaverDirectory;
		const conversationsFolder = path.join(weaverDirectory, 'conversations');
		await ensureFoldersExist(this.plugin.app.vault.adapter as FileSystemAdapter, [weaverDirectory, conversationsFolder]);
	}

	/**
	 * Retrieves the Zustand store instance.
	 * Throws an error if the store has not been initialized.
	 */
	public getStore(): WeaverStore {
		if (!this.store) {
			throw new Error("Store has not been initialized. Call initializeStore() first.");
		}
		return this.store;
	}

    private async hydrateStore(): Promise<Partial<WeaverStoreProps>> {
		const locals = await this.getStoreData();

        const hydratedProps: Partial<WeaverStoreProps> = {
			previousConversationId: locals.previousConversationId
        };

        return { ...hydratedProps };
    }

	public async getStoreData(): Promise<IStore> {
		try {
			const data = await this.plugin.app.vault.adapter.read(this.plugin.settings.weaverContextStorage);
			return JSON.parse(data) as IStore;
		} catch (error: any) {
			if (error.message.includes('ENOENT')) {
				// File does not exist; return default store data
				return DEFAULT_CONTEXT_STATES;
			}
			throw error; // Re-throw other errors
		}
	}
}
