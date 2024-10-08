import { App } from "obsidian";
import { createContext } from "react";

export const AppContext = createContext<App | undefined>(undefined);
