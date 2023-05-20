import Weaver from "main";
import RequestFormatter from "./RequestFormatter";
import { IChatMessage } from "interfaces/IThread";
import { Notice } from "obsidian";
import { OpenAIRequestManager } from "./OpenAIRequestManager";

export default class OpenAIContentProvider {
	private readonly plugin: Weaver;

	private requestFormatter: RequestFormatter;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
		this.requestFormatter = new RequestFormatter(this.plugin);
	}

	async generateResponse(
		parameters: any = this.plugin.settings,
		streamManager: OpenAIRequestManager,
		additionalParameters: any = {},
		conversationContext: IChatMessage[],
		userMessage: IChatMessage,
		addMessage: (message: IChatMessage) => void,
		updateCurrentAssistantMessageContent: (content: string) => void,
	) {
		const requestParameters = this.requestFormatter.prepareChatRequestParameters(parameters, additionalParameters, conversationContext);
		try {
			await streamManager.streamSSE(
				requestParameters,
				userMessage,
				addMessage,
				updateCurrentAssistantMessageContent,
			);
		} catch (error) {
			if (!error || !error.data) {
				console.error('Unexpected error format in streamSSE:', error);
			} else {
				const errorData = JSON.parse(error.data);

				// if (errorData && errorData.error) {
				// 	new Notice(
				// 		`OpenAI error: ${errorData.error.code}. `
				// 		+ `Pls check the console for the full error message.`
				// 	);
				// }

				console.error('Error in streamSSE:', error.data);
			}
		}
	}
}
