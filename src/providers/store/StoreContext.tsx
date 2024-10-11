import { createContext } from "react";
import { WeaverStoreProps } from "store/slices/store.slicemaster";

export const StoreContext = createContext<WeaverStoreProps | undefined>(undefined);
