import { createContext } from "react";
import { ConversationService } from "services/conversation/ConversationService";

export const ConversationContext = createContext<ConversationService | undefined>(undefined);
