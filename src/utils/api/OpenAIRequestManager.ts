import { IChatMessage } from "interfaces/IThread";
import { SSE } from "../../js/sse/sse";
import { v4 as uuidv4 } from 'uuid';

export class OpenAIRequestManager {
	private stopRequested = false;

	constructor() { }

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
			role: 'assistant',
			parent: userMessage.id
		};
	}

	streamSSE = (
		requestParameters: any,
		userMessage: IChatMessage,
		addMessage: (message: IChatMessage) => void,
		updateCurrentAssistantMessageContent: (content: string) => void
	): Promise<string | null> => {
		return new Promise((resolve, reject) => {
			let assistantResponse = '';

			try {
				if (!requestParameters) {
					throw new Error('requestParameters is undefined');
				}

				let source = new SSE(requestParameters.url, {
					headers: requestParameters.headers,
					method: requestParameters.method,
					payload: requestParameters.body,
				});

				const onMessage = async (e: any) => {
					if (this.stopRequested) {
						source?.close();
						addMessage(this.createAssistantMessage(userMessage, assistantResponse));
						this.stopRequested = false;
						resolve(null);
						return;
					}

					if (e.data !== "[DONE]") {
						const payload = JSON.parse(e.data);
						const text = payload.choices[0].delta.content;

						if (!text) {
							return;
						}

						assistantResponse += text;
						updateCurrentAssistantMessageContent(assistantResponse);
					} else {
						source?.close();
						addMessage(this.createAssistantMessage(userMessage, assistantResponse));
						resolve(assistantResponse);
					}
				};

				const onError = (error: any) => {
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

					source?.close();
					reject(error);
				};

				source.addEventListener('message', onMessage);
				source.addEventListener('error', onError);

				source.stream();
			} catch (err) {
				console.error('Caught an error in streamSSE:', err);
				reject(err);
			}
		});
	};
}
