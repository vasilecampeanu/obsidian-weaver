import { createContext } from "react";
import { WeaverStore } from "services/store/Store";

export const StoreContext = createContext<WeaverStore | undefined>(undefined);
