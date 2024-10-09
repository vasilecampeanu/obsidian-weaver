import Weaver from "main";
import { createContext } from "react";

export const PluginContext = createContext<Weaver | undefined>(undefined);
