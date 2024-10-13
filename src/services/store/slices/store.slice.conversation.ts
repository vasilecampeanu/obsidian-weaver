import { IConversation } from 'interfaces/IConversation';
import { StateCreator } from 'zustand';

export interface ConversationProps {
    conversation: IConversation | null;
}

export const DEFAULT_CONVERSATION_STATES: ConversationProps = {
    conversation: null,
};

export interface ConversationState extends ConversationProps {
    setConversation: (conversation: IConversation | null) => void;
}

export const createConversationSlice = (): StateCreator<
	ConversationState,
    [],
    [],
    ConversationState
> => (set, get) => ({
    ...DEFAULT_CONVERSATION_STATES,
    setConversation: (conversation) => set({ conversation }),
});
