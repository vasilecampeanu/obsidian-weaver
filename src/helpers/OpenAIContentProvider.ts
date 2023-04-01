import Weaver from "main";
import { App, request } from "obsidian";
import RequestFormatter from "./RequestFormatter";
import safeAwait from "safe-await";
import { IMessage } from "../components/ChatView";

export default class OpenAIContentProvider {
	plugin: Weaver;
	app: App;
	reqFormatter: RequestFormatter;

	constructor(app: App, plugin: Weaver) {
		this.app = app;
		this.plugin = plugin;
		this.reqFormatter = new RequestFormatter(app, plugin,);
	}

	async generate(messages: IMessage[], params: any = this.plugin.settings, additionalParams: any = {}) {
		let prompt = messages.map(msg => `${msg.role === 'user' ? 'user' : 'assistant'}: ${msg.content}`).join('\n');
		console.log(prompt)
		let reqParameters: any = this.reqFormatter.addContext(params, prompt);
		reqParameters = this.reqFormatter.prepareRequestParameters(reqParameters, additionalParams);
		const [error, result] = await safeAwait(this.getGeneratedResponse(reqParameters));
	
		if (error) {
			console.error("Error in generate:", error);
			return null;
		}
	
		return result;
	}
	

	async getGeneratedResponse(reqParams: any) {
		const { extractResult, ...remainingReqParams } = reqParams;
		const [errorRequest, requestResults] = await safeAwait(request(remainingReqParams));

		if (errorRequest) {
			return Promise.reject(errorRequest);
		}

		const jsonResponse = JSON.parse(requestResults as string);
		const response = eval(extractResult);

		return response;
	}
}
