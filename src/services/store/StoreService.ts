import Weaver from 'main';
import { FileSystemAdapter } from 'obsidian';
import * as path from 'path';
import { ensureFoldersExist } from "utils/FileIOUtils";
import { ContextProps, DEFAULT_CONTEXT_STATES } from "./slices/store.slice.context";
import { WeaverStoreProps } from "./slices/store.slicemaster";
import { createWeaverStore, WeaverStore } from "./Store";

export class StoreService {
	private store: WeaverStore | null = null;

	constructor(private plugin: Weaver) {}

	public async initializeStore(): Promise<void> {
		await this.ensureLocalStorage();
		const hydration = await this.hydrateStore();
		this.store = createWeaverStore(this.plugin, hydration);
	}

	private async ensureLocalStorage(): Promise<void> {
		const weaverDirectory = this.plugin.settings.weaverDirectory;
		const conversationsFolder = path.join(weaverDirectory, 'conversations');
		await ensureFoldersExist(this.plugin.app.vault.adapter as FileSystemAdapter, [weaverDirectory, conversationsFolder]);
	}

	public getStore(): WeaverStore {
		if (!this.store) {
			throw new Error("Store has not been initialized. Call initializeStore() first.");
		}

		return this.store;
	}

    private async hydrateStore(): Promise<Partial<WeaverStoreProps>> {
		const context = await this.getContextData();

        const hydratedProps: Partial<WeaverStoreProps> = {
			previousConversationId: context.previousConversationId
        };

        return { ...hydratedProps };
    }

	public async getContextData(): Promise<ContextProps> {
		try {
			const data = await this.plugin.app.vault.adapter.read(this.plugin.settings.weaverContextStorage);
			return JSON.parse(data) as ContextProps;
		} catch (error: any) {
			if (error.message.includes('ENOENT')) {
				return DEFAULT_CONTEXT_STATES;
			}

			throw error; 
		}
	}
}
