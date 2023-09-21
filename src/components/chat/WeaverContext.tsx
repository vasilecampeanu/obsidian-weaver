import Weaver from 'main';
import React, { createContext, useReducer, ReactNode, useContext, FC, Dispatch } from 'react';
import { Conversation } from 'interfaces/Conversation';
import { ConversationManager } from 'utils/ConversationManager';
import { ActionTypes } from 'types/ActionTypes';

interface State {
    conversation: Conversation | null;
};

const initialState: State = {
    conversation: null
};

interface Action { type: ActionTypes.CREATE_CONVERSATION; payload: Conversation }

type WeaverContextType = [State, Dispatch<Action>, ConversationManager];

const WeaverContext = createContext<WeaverContextType | undefined>(undefined);	

const chatReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case ActionTypes.CREATE_CONVERSATION:
            return { ...state, conversation: action.payload };
        default:
            return state;
    }
};

export const WeaverProvider: FC<{ children: ReactNode; plugin: Weaver }> = ({ children, plugin }) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const manager = new ConversationManager(plugin);

    return (
        <WeaverContext.Provider value={[state, dispatch, manager]}>
            {children}
        </WeaverContext.Provider>
    );
};

export const useWeaver = (): WeaverContextType => {
    const context = useContext(WeaverContext);

	if (!context) {
        throw new Error('useChat must be used within a WeaverProvider');
    }

    return context;
};
