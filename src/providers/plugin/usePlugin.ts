import Weaver from "main";
import { useContext } from "react";
import { PluginContext } from "./PluginContext";

export const usePlugin = (): Weaver => {
	return useContext(PluginContext)!;
};
