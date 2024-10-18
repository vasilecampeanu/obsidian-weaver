import { EChatModels } from 'enums/EProviders';
import { IMessage } from 'interfaces/IConversation';
import OpenAI from 'openai';
import { ChatCompletionChunk } from 'openai/resources/chat/completions';

export class OpenAIRequestManager {
	private client: OpenAI;

	constructor(apiKey: string) {
		this.client = new OpenAI({
			apiKey,
			dangerouslyAllowBrowser: true,
		});
	}

	public async sendMessageStream(
		messages: IMessage[],
		model: EChatModels,
		abortSignal?: AbortSignal
	): Promise<AsyncIterable<ChatCompletionChunk>> {
		const apiMessages = messages.map((msg) => ({
			role: msg.author.role,
			content: msg.content.parts.join(''),
		}));

		try {
			const response = await this.client.chat.completions.create(
				{
					model,
					messages: apiMessages,
					stream: true,
				},
				{
					signal: abortSignal,
				}
			);

			return response;
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.error('Request aborted');
				throw new Error('Request was aborted');
			}
			console.error('Error in sendMessageStream:', error);
			throw new Error('Failed to send message stream to OpenAI API');
		}
	}
}
