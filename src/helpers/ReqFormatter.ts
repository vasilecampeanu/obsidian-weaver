import Weaver from "main";
import { App } from "obsidian";
import { WeaverSettings } from "settings";

export default class ReqFormatter {
	plugin: Weaver;
	app: App;

	constructor(app: App, plugin: Weaver) {
		this.plugin = plugin;
		this.app = app;
	}

	addContext(parameters: WeaverSettings, prompt: string) {
		const params = {
			...parameters,
			prompt
		}

		return params;
	}
}
