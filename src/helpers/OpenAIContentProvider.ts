import Weaver from "main";
import { request } from "obsidian";
import RequestFormatter from "./RequestFormatter";
import safeAwait from "safe-await";
import { IChatMessage } from "../components/chat/ConversationDialogue";

export default class OpenAIContentProvider {
	private readonly plugin: Weaver;
	private requestFormatter: RequestFormatter;
	private ongoingRequest: AbortController | null = null;
	private requestCancelled: boolean = false;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
		this.requestFormatter = new RequestFormatter(this.plugin);
	}

	async generateResponse(parameters: any = this.plugin.settings, additionalParameters: any = {}, conversationHistory: IChatMessage[]) {
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
				let errorMessage = "";

				switch (response.status) {
					case 401:
						errorMessage = "Error: Invalid Authentication. Ensure the correct API key and requesting organization are being used.";
						break;
					case 404:
						errorMessage = "Error: The selected model is unavailable. Check your API key, organization status, and model access permissions, then try again.";
						break;
					case 429:
						errorMessage = "Error: Rate limit reached or quota exceeded. Please check your plan and billing details and try again later.";
						break;
					case 500:
						errorMessage = "Error: Server error. Retry your request after a brief wait and contact us if the issue persists.";
						break;
					default:
						errorMessage = `Error: HTTP error! status: ${response.status}`;
				}

				return errorMessage;
			}
	

			const jsonResponse = await response.json();
			const content = jsonResponse?.choices[0].message.content;

			return content;
		} catch (error) {
			if (error.name === "AbortError") {
				console.log("Request aborted!");
			} else {
				console.error("Error in requestAssistantResponse:", error);
			}
			return Promise.reject(error);
		}
	}

	cancelRequest() {
		if (this.ongoingRequest) {
			this.ongoingRequest.abort();
			this.ongoingRequest = null;
			this.requestCancelled = true;
		}
	}

	isRequestCancelled() {
		const wasCancelled = this.requestCancelled;
		this.requestCancelled = false;
		return wasCancelled;
	}
}
