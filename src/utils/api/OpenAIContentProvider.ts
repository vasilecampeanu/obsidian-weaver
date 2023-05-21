import Weaver from "main";
import RequestFormatter from "./RequestFormatter";
import { IChatMessage } from "interfaces/IThread";
import { Notice } from "obsidian";
import { OpenAIRequestManager } from "./OpenAIRequestManager";

export default class OpenAIContentProvider {
	private readonly plugin: Weaver;
	private requestFormatter: RequestFormatter;
	private streamManager: OpenAIRequestManager;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
		this.requestFormatter = new RequestFormatter(this.plugin);
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
		const requestParameters = this.requestFormatter.prepareChatRequestParameters(parameters, additionalParameters, conversationContext);

		try {
			await this.streamManager.streamSSE(
				requestParameters,
				userMessage,
				addMessage,
				updateCurrentAssistantMessageContent,
			);
		} catch (error) {
			if (!error || !error.data) {
				console.error('Unexpected error format in streamSSE:', error);
			} else {
				console.error('Error in streamSSE:', error.data);
			}
		}
	}

	public async stopStreaming() {
		this.streamManager.stopStreaming();
	}
}
