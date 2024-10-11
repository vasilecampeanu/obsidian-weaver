import { useContext } from "react";
import { ConversationService } from "services/conversation/ConversationService";
import { ConversationServiceContext } from "./ConversationServiceContext";

export const useConversationService = (): ConversationService | undefined => {
	return useContext(ConversationServiceContext);
};
