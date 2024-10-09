import Weaver from "main";
import { useContext } from "react";
import { PluginContext } from "./PluginContext";

export const usePlugin = (): Weaver | undefined => {
	return useContext(PluginContext);
};
