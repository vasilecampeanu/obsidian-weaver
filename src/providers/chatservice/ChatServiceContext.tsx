import { createContext } from "react";
import { ChatService } from "services/ChatService";

export const ChatServiceContext = createContext<ChatService | undefined>(undefined);
