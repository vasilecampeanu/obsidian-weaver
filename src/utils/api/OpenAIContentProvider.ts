import Weaver from "main";
import OpenAIRequestFormatter from "./OpenAIRequestFormatter";
import { IChatMessage } from "interfaces/IThread";
import { Notice } from "obsidian";
import { OpenAIRequestManager } from "./OpenAIRequestManager";

export default class OpenAIContentProvider {
	private readonly plugin: Weaver;
	private OpenAIRequestFormatter: OpenAIRequestFormatter;
	private streamManager: OpenAIRequestManager;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
		this.OpenAIRequestFormatter = new OpenAIRequestFormatter(this.plugin);
		this.streamManager = new OpenAIRequestManager();
	}

	public async generateResponse(
		parameters: any = this.plugin.settings,
		additionalParameters: any = {},
		conversationContext: IChatMessage[],
		userMessage: IChatMessage,
		addMessage: (message: IChatMessage) => void,
		updateCurrentAssistantMessageContent: (content: string) => void,
	) {
		const requestParameters = this.OpenAIRequestFormatter.prepareChatRequestParameters(parameters, additionalParameters, conversationContext);

		try {
			await this.streamManager.handleOpenAIStreamSSE(
				requestParameters,
				userMessage,
				addMessage,
				updateCurrentAssistantMessageContent,
			);
		} catch (error) {
			console.error('Error in handleOpenAIStreamSSE:', error.data);
		}
	}

	public async stopStreaming() {
		this.streamManager.stopStreaming();
	}
}
