// Obsidian
import Weaver from "main";
import { WeaverSettings } from "settings";

// Interfaces
import { IChatMessage, IConversation } from "interfaces/IThread";

interface BodyParameters {
	messages: { role: string; content: string; }[];
	frequency_penalty: number;
	max_tokens: number;
	model: string;
	temperature: number;
	stream: boolean;
}

export default class OpenAIRequestFormatter {
	private readonly plugin: Weaver;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
	}

	prepareChatRequestParameters(
		parameters: WeaverSettings, 
		additionalParameters: {
			bodyParameters?: BodyParameters,
			requestParameters?: {
				url: string,
				method: string,
				body: string,
				headers: {[
					key: string
				]: string}
			}
		} = {}, conversation: IConversation, conversationHistory: IChatMessage[] = []) {
		try {
			const requestUrlBase = "https://api.openai.com/v1";
			const requestUrl = `${requestUrlBase}/chat/completions`;

			const bodyParameters: BodyParameters = {
				frequency_penalty: parameters.frequencyPenalty,
				max_tokens: parameters.maxTokens,
				model: conversation.model ? conversation.model : parameters.engine,
				temperature: parameters.temperature,
				stream: true,
				messages: []
			};

			bodyParameters.messages = conversationHistory.map((message: IChatMessage) => {
				return { role: message.author.role, content: message.content.parts };
			});

			console.log(bodyParameters.messages)

			const mergedBodyParameters = { ...bodyParameters, ...additionalParameters?.bodyParameters };

			const requestParameters = {
				url: requestUrl,
				method: "POST",
				body: JSON.stringify(mergedBodyParameters),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${parameters.apiKey}`,
					...(process.env.OPENAI_ORGANIZATION && {
						'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
					})
				}
			};

			return { ...requestParameters, ...additionalParameters?.requestParameters };
		} catch (error) {
			console.error('Error in prepareChatRequestParameters:', error);
			throw error;
		}
	}
}
