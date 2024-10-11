import { TFile } from "obsidian";

export interface IUserSelection {
	text: string;
	file: TFile | null;
}
