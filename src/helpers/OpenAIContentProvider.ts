import Weaver from "main";
import { request } from "obsidian";
import RequestFormatter from "./RequestFormatter";
import safeAwait from "safe-await";
import { IMessage } from "../components/ChatView";

export default class OpenAIContentProvider {
	private readonly plugin: Weaver;
	private requestFormatter: RequestFormatter;
	private ongoingRequest: AbortController | null = null;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
		this.requestFormatter = new RequestFormatter(this.plugin);
	}

	async generateResponse(parameters: any = this.plugin.settings, additionalParameters: any = {}, conversationHistory: IMessage[]) {
		try {
			const requestParameters = this.requestFormatter.prepareChatRequestParameters(parameters, additionalParameters, conversationHistory);
			const [error, result] = await safeAwait(this.requestAssistantResponse(requestParameters));

			if (error) {
				if (error instanceof DOMException && error.name === 'AbortError') {
					console.warn('Request aborted by the user');
				} else {
					console.error('Error in generate:', error);
				}
				return null;
			}

			return result;
		} catch (error) {
			console.error('Error in generateResponse:', error);
			return null;
		}
	}


	async requestAssistantResponse(requestParameters: any) {
		try {
			this.ongoingRequest = new AbortController();
			const { signal } = this.ongoingRequest;

			const response = await fetch(requestParameters.url, {
				method: requestParameters.method,
				body: requestParameters.body,
				headers: requestParameters.headers,
				signal
			});

			this.ongoingRequest = null;

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const jsonResponse = await response.json();
			const content = jsonResponse?.choices[0].message.content;

			return content;
		} catch (error) {
			if (error.name === "AbortError") {
				console.log("Request aborted");
			} else {
				console.error("Error in requestAssistantResponse:", error);
			}
			return Promise.reject(error);
		}
	}

	cancelRequest() {
		console.log("Hello world!")
		if (this.ongoingRequest) {
			console.log("Hello world!")
			this.ongoingRequest.abort();
			this.ongoingRequest = null;
		}
	}
}
