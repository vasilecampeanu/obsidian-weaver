import { IConversation } from 'interfaces/IConversation';
import { StateCreator } from 'zustand';

export interface ConversationProps {
    currentConversation: IConversation | null;
}

export const DEFAULT_CONVERSATION_STATES: ConversationProps = {
    currentConversation: null,
};

export interface ConversationState extends ConversationProps {
    setCurrentConversation: (conversation: IConversation | null) => void;
}

export const createConversationSlice = (): StateCreator<
	ConversationState,
    [],
    [],
    ConversationState
> => (set, get) => ({
    ...DEFAULT_CONVERSATION_STATES,
    setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
});
