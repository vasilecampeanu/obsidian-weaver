import Weaver from "main";
import { FileSystemAdapter } from "obsidian";
import { WeaverStoreProps } from "./slices/store.slicemaster";
import { createWeaverStore, WeaverStore } from "./Store";

export class StoreService {
    private plugin: Weaver;
    private adapter: FileSystemAdapter;

    constructor(plugin: Weaver) {
        this.plugin = plugin;
        this.adapter = plugin.app.vault.adapter as FileSystemAdapter;
    }

    /**
     * Ensures that the local storage schema (folder structure) exists.
     * Creates necessary folders if they do not exist.
     */
    public async ensureLocalStorage(): Promise<void> {
        const weaverFolder = this.plugin.settings.weaverFolder;
        const conversationsFolder = `${weaverFolder}/conversations`;
        await this.ensureFoldersExist([weaverFolder, conversationsFolder]);
    }

    /**
     * Creates a Zustand store with the defined slices.
     */
    public async createStore(): Promise<WeaverStore> {
        const hydration = await this.hydrateStore();
        return createWeaverStore(hydration);
    }

    private async hydrateStore(): Promise<Partial<WeaverStoreProps>> {
        const hydratedProps: Partial<WeaverStoreProps> = {
            // Initialize any required state here
        };

        return { ...hydratedProps };
    }

    /**
     * Ensures that the specified folders exist. Creates them if they do not.
     * @param folderPaths - An array of folder paths to ensure exist.
     */
    private async ensureFoldersExist(folderPaths: string[]): Promise<void> {
        for (const path of folderPaths) {
            const exists = await this.adapter.exists(path);
            if (!exists) {
                await this.adapter.mkdir(path);
            }
        }
    }
}
