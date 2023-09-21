import React, { createContext, useReducer, ReactNode, useContext } from 'react';
import { Conversation } from 'interfaces/Conversation';
import { ConversationManager } from 'utils/ConversationManager';
import Weaver from 'main';

interface State {
    activeConversation: Conversation | null;
};

const initialState: State = {
    activeConversation: null
};

interface Action { type: 'CREATE_CONVERSATION'; payload: Conversation }

type ChatContextType = [State, React.Dispatch<Action>, ConversationManager];

const ChatContext = createContext<ChatContextType | undefined>(undefined);	

const chatReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'CREATE_CONVERSATION':
            return { ...state, activeConversation: action.payload };
        default:
            return state;
    }
};

export const ChatProvider: React.FC<{ children: ReactNode; plugin: Weaver }> = ({ children, plugin }) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const manager = new ConversationManager(plugin);

    return (
        <ChatContext.Provider value={[state, dispatch, manager]}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);

	if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }

    return context;
};
