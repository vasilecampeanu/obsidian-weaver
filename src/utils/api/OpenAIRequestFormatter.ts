// Obsidian
import Weaver from "main";
import { WeaverSettings } from "settings";

// Interfaces
import { IChatMessage, IConversation } from "interfaces/IThread";

interface BodyParameters {
	frequency_penalty: number;
	max_tokens: number;
	messages?: { role: string; content: string }[];
	model: string;
	temperature: number;
	stream: boolean;
}

export default class OpenAIRequestFormatter {
	private readonly plugin: Weaver;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
	}

	prepareChatRequestParameters(parameters: WeaverSettings, additionalParameters: any = {}, conversation: IConversation, conversationHistory: IChatMessage[] = []) {
		try {
			const requestUrlBase = parameters.provider;
			let requestUrl = `${requestUrlBase}/chat/completions`;

			const bodyParameters: BodyParameters = {
				frequency_penalty: parameters.frequencyPenalty,
				max_tokens: parameters.maxTokens,
				model: conversation.model ? conversation.model : parameters.engine,
				temperature: parameters.temperature,
				stream: true
			};

			bodyParameters.messages = conversationHistory.map((message) => {
				return { role: message.role, content: message.content };
			});

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
