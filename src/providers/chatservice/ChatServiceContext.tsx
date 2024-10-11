import { createContext } from "react";
import { ChatService } from "services/chat/ChatService";

export const ChatServiceContext = createContext<ChatService | undefined>(undefined);
