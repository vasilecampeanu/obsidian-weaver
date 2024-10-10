import { ConversationManager } from "apis/ConversationManager";
import { OpenAIManager } from "apis/OpenAIManager";

export class ChatService {
	constructor(private openAIManager: OpenAIManager, private conversationManager: ConversationManager) {
		
	}
}
