import { IMessage } from 'interfaces/IConversation';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming';

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
		model: string = 'gpt-4'
	): Promise<AsyncIterable<Stream<ChatCompletionChunk>>> {
		const apiMessages = messages.map((msg) => ({
			role: msg.author.role,
			content: msg.content.parts.join(''),
		}));

		try {
			const response = await this.client.chat.completions.create({
				model,
				messages: apiMessages,
				stream: true,
			});

			return response as AsyncIterable<Stream<ChatCompletionChunk>>;
		} catch (error) {
			console.error('Error in sendMessageStream:', error);
			throw new Error('Failed to send message stream to OpenAI API');
		}
	}

	public async sendMessage(
		messages: IMessage[],
		model: string = 'gpt-4'
	): Promise<ChatCompletion> {
		const apiMessages = messages.map((msg) => ({
			role: msg.author.role,
			content: msg.content.parts.join(''),
		}));

		try {
			const response = await this.client.chat.completions.create({
				model,
				messages: apiMessages,
				stream: false,
			});

			return response as ChatCompletion;
		} catch (error) {
			console.error('Error in sendMessage:', error);
			throw new Error('Failed to send message to OpenAI API');
		}
	}
}
