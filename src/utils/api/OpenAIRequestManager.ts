import { IChatMessage } from "interfaces/IThread";
import { SSE } from 'sse';
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
	
				console.log('Attempting to create SSE with parameters:', requestParameters);
	
				let source = new SSE(requestParameters.url, {
					headers: requestParameters.headers,
					method: requestParameters.method,
					payload: requestParameters.body,
				});
	
				const onMessage = async (e: any) => {
					console.log('Received message:', e);
					if (this.stopRequested) {
						console.log('Stopping as stop requested');
						source?.close();
						source = null;
						addMessage(this.createAssistantMessage(userMessage, assistantResponse));
						this.stopRequested = false;
						resolve(null);
						return;
					}
	
					if (e.data !== "[DONE]") {
						const payload = JSON.parse(e.data);
						const text = payload.choices[0].delta.content;
	
						console.log(text);
	
						if (!text) {
							return;
						}
	
						assistantResponse += text;
						updateCurrentAssistantMessageContent(assistantResponse);
					} else {
						console.log('Received [DONE], closing source');
						source?.close();
						source = null;
						addMessage(this.createAssistantMessage(userMessage, assistantResponse));
						resolve(assistantResponse);
					}
				};
	
				const onError = (e: any) => {
					console.error('Error event received:', e);
					source?.close();
					source = null;
					reject(e);
				};
	
				console.log('Attaching event listeners to source');
				source.addEventListener('message', onMessage);
				source.addEventListener('error', onError);
	
				console.log('Starting streaming');
				source.stream();
			} catch (err) {
				console.error('Caught an error in streamSSE:', err);
				reject(err);
			}
		});
	};
}
