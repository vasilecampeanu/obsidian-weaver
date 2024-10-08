import { App } from "obsidian";
import { useContext } from "react";
import { AppContext } from "./AppContext";

export const useApp = (): App | undefined => {
	return useContext(AppContext);
};
