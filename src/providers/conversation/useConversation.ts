import { useContext } from "react";
import { ConversationService } from "services/conversation/ConversationService";
import { ConversationContext } from "./ConversationContext";

export const useConversation = (): ConversationService | undefined => {
	return useContext(ConversationContext);
};
