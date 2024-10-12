import { WeaverStoreProps } from "store/slices/store.slicemaster";
import { createWeaverStore } from "store/WeaverStore";

export class StoreService {
	constructor() {
	}

    public async hydrateStore(): Promise<Partial<WeaverStoreProps>> {
		const hydratedProps: Partial<WeaverStoreProps> = {};
        return { ...hydratedProps };
	}

    /**
     * Creates a new instance of the workbench store.
     * @returns A promise that resolves to the created workbench store.
     */
    public async createStore(): Promise<WeaverStoreProps> {
        const hydration: WeaverStoreProps = {
            ...await this.hydrateStore()
        };

        return createWeaverStore(hydration);
    }
}
