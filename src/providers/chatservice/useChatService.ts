import { useContext } from "react";
import { ChatService } from "services/chat/ChatService";
import { ChatServiceContext } from "./ChatServiceContext";

export const useChatService = (): ChatService | undefined => {
	return useContext(ChatServiceContext);
};
