import Weaver from "main";
import { request } from "obsidian";
import RequestFormatter from "./RequestFormatter";
import safeAwait from "safe-await";
import { IMessage } from "../components/ChatView";

export default class OpenAIContentProvider {
	plugin: Weaver;
	requestFormatter: RequestFormatter;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
		this.requestFormatter = new RequestFormatter(this.plugin);
	}

	async generateResponse(parameters: any = this.plugin.settings, additionalParameters: any = {}, conversationHistory: IMessage[]) {
		try {
			const requestParameters = this.requestFormatter.prepareChatRequestParameters(parameters, additionalParameters, conversationHistory);
			const [error, result] = await safeAwait(this.requestAssistantResponse(requestParameters));
	
			if (error) {
				console.error("Error in generate:", error);
				return null;
			}
	
			return result;
		} catch (error) {
			console.error("Error in generateResponse:", error);
			return null;
		}
	}

	async requestAssistantResponse(requestParameters: any) {
		try {
			const [errorRequest, requestResults] = await safeAwait(request(requestParameters));

			if (errorRequest) {
				return Promise.reject(errorRequest);
			}

			const jsonResponse = JSON.parse(requestResults as string);
			const response = jsonResponse?.choices[0].message.content;

			return response;
		} catch (error) {
			console.error("Error in requestAssistantResponse:", error);
			return Promise.reject(error);
		}
	}
}
