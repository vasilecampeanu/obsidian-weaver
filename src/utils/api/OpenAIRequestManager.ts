import { IChatMessage } from "interfaces/IThread";
import { SSE } from "../../js/sse/sse";
import { v4 as uuidv4 } from 'uuid';
import Weaver from "main";

export class OpenAIRequestManager {
	private readonly plugin: Weaver;
	private stopRequested = false;
	private assistantResponseChunks: string[] = [];
	private DONE_MESSAGE = '[DONE]';

	constructor(plugin: Weaver) { 
		this.plugin = plugin;
	}

	stopStreaming(): void {
		this.stopRequested = true;
	}

	private createAssistantMessage(userMessage: IChatMessage, content: string): IChatMessage {
		return {
			children: [],
			content: content,
			context: false,
			creationDate: new Date().toISOString(),
			id: uuidv4(),
			model: this.plugin.settings.engine,
			role: 'assistant',
			parent: userMessage.id
		};
	}

	private onMessage = async (
		e: any,
		response: SSE,
		userMessage: IChatMessage,
		addMessage: (message: IChatMessage) => void,
		updateCurrentAssistantMessageContent: (content: string) => void,
		resolve: (value: string | null) => void
	) => {
		if (this.stopRequested) {
			response?.close();
			addMessage(this.createAssistantMessage(userMessage, this.assistantResponseChunks.join('')));
			this.stopRequested = false;
			this.assistantResponseChunks = [];
			return;
		}

		if (e.data !== this.DONE_MESSAGE) {
			const payload = JSON.parse(e.data);
			const text = payload.choices[0].delta.content;

			if (!text) {
				return;
			}

			this.assistantResponseChunks.push(text);
			updateCurrentAssistantMessageContent(this.assistantResponseChunks.join(''));
		} else {
			response?.close();
			addMessage(this.createAssistantMessage(userMessage, this.assistantResponseChunks.join('')));
			this.assistantResponseChunks = [];
			resolve(this.assistantResponseChunks.join(''));
		}
	}

	private onError = (
		error: any,
		response: SSE,
		userMessage: IChatMessage,
		addMessage: (message: IChatMessage) => void,
		reject: (reason?: any) => void
	) => {
		const errorStatus = JSON.parse(error.status);
		let errorMessage = "";

		switch (errorStatus) {
			case 401:
				errorMessage = "Error: Invalid authentication. Ensure the correct API key and requesting organization are being used.";
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
				errorMessage = `Error: HTTP error! status: ${errorStatus}`;
		}

		addMessage(this.createAssistantMessage(userMessage, errorMessage));

		response?.close();
		reject(new Error(errorMessage));
	}

	public handleOpenAIStreamSSE = (
		requestParameters: any,
		userMessage: IChatMessage,
		addMessage: (message: IChatMessage) => void,
		updateCurrentAssistantMessageContent: (content: string) => void
	): Promise<string | null> => {
		return new Promise((resolve, reject) => {
			try {
				if (!requestParameters) {
					throw new Error('requestParameters is undefined');
				}

				let response = new SSE(requestParameters.url, {
					headers: requestParameters.headers,
					method: requestParameters.method,
					payload: requestParameters.body,
				});

				response.addEventListener('message', (e: any) => this.onMessage(e, response, userMessage, addMessage, updateCurrentAssistantMessageContent, resolve));
				response.addEventListener('error', (error: any) => this.onError(error, response, userMessage, addMessage, reject));

				response.stream();
			} catch (err) {
				console.error('Caught an error in handleOpenAIStreamSSE:', err);
				reject(err);
			}
		});
	};
}
