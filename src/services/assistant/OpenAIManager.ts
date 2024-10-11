import { IMessage } from 'interfaces/IConversation';
import Weaver from 'main';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions';
import { Stream } from 'openai/streaming';

export class OpenAIManager {
	private static instance: OpenAIManager;
	private client: OpenAI;

	private constructor(plugin: Weaver) {
		this.client = new OpenAI({
			apiKey: plugin.settings.apiKey,
			dangerouslyAllowBrowser: true,
		});
	}

	public static getInstance(plugin: Weaver): OpenAIManager {
		if (!OpenAIManager.instance) {
			OpenAIManager.instance = new OpenAIManager(plugin);
		}

		return OpenAIManager.instance;
	}

	/**
	 * Sends a message stream to the OpenAI API and returns an async iterable.
	 */
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
				model: model,
				messages: apiMessages,
				stream: true,
			});

			return response as AsyncIterable<Stream<ChatCompletionChunk>>;
		} catch (error) {
			console.error('Error in sendMessageStream:', error);
			throw error;
		}
	}

	/**
	 * Sends a message to the OpenAI API and returns the completion.
	 */
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
				model: model,
				messages: apiMessages,
				stream: false,
			});

			return response as ChatCompletion;
		} catch (error) {
			console.error('Error in sendMessage:', error);
			throw error;
		}
	}
}
