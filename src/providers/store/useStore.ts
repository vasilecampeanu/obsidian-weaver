import { useContext } from "react";
import { WeaverStore } from "services/store/Store";
import { StoreContext } from "./StoreContext";

export const useStore = (): WeaverStore | undefined => {
	return useContext(StoreContext);
};
