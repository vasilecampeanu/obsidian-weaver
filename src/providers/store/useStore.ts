import { useContext } from "react";
import { WeaverStoreSession } from "services/store/slices/store.slicemaster";
import { useStore as useZustandStore } from "zustand";
import { StoreContext } from "./StoreContext";

// TODO: Allow using a custom equality function
//       https://docs.pmnd.rs/zustand/guides/initialize-state-with-props#optionally-allow-using-a-custom-equality-function
export const useStore = <T>(selector: (state: WeaverStoreSession) => T): T => {
    const store = useContext(StoreContext);
    if (!store) throw new Error('Missing StoreContext.Provider in the tree');
    return useZustandStore(store, selector);
};
