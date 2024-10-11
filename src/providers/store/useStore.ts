import { useContext } from "react";
import { WeaverStoreProps } from "store/slices/store.slicemaster";
import { StoreContext } from "./StoreContext";

export const useStore = (): WeaverStoreProps | undefined => {
	return useContext(StoreContext);
};
