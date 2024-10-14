import { useContext } from "react";
import { WeaverStoreSession } from "services/store/slices/store.slicemaster";
import { useStore as useZustandStore } from "zustand";
import { StoreContext } from "./StoreContext";

export const useStore = <T>(selector: (state: WeaverStoreSession) => T): T => {
    const store = useContext(StoreContext);
    if (!store) throw new Error('Missing StoreContext.Provider in the tree');
    return useZustandStore(store, selector);
};
