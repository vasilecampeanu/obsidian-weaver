import Weaver from "main";
import { WeaverSettings } from "settings";
import { IChatMessage } from "components/chat/ConversationDialogue";

interface BodyParameters {
	model: string;
	max_tokens: number;
	temperature: number;
	frequency_penalty: number;
	messages?: { role: string; content: string }[];
}

export default class RequestFormatter {
	private readonly plugin: Weaver;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
	}

	prepareChatRequestParameters(parameters: WeaverSettings, additionalParameters: any = {}, conversationHistory: IChatMessage[] = []) {
		try {
			const requestUrlBase = "https://api.openai.com/v1";
			let requestUrl = `${requestUrlBase}/chat/completions`;

			const bodyParameters: BodyParameters = {
				model: parameters.engine,
				max_tokens: parameters.max_tokens,
				temperature: parameters.temperature,
				frequency_penalty: parameters.frequency_penalty,
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
					Authorization: `Bearer ${parameters.api_key}`,
				}
			};

			return { ...requestParameters, ...additionalParameters?.requestParameters };
		} catch (error) {
			console.error('Error in prepareChatRequestParameters:', error);
			throw error;
		}
	}
}
