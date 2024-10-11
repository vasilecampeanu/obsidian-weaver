import { createContext } from "react";
import { ChatService } from "services/chat/ConversationService";

export const ChatServiceContext = createContext<ChatService | undefined>(undefined);
