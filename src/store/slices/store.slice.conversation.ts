import { StateCreator } from 'zustand';

export interface ConversationProps {}
export const DEFAULT_CONVERSATION_STATES: ConversationProps = { };
export interface ConversationState extends ConversationProps { }

export const createConversationSlice = (): StateCreator<
	ConversationState,
    [],
    [],
    ConversationState
> => (set, get) => ({
    ...DEFAULT_CONVERSATION_STATES,
});
