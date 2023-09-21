import React, { createContext, useReducer, ReactNode, useContext, FC, Dispatch } from "react";
import { Conversation } from "interfaces/Conversation";
import { ConversationManager } from "utils/ConversationManager";
import { ChatActionTypes, ThreadActionTypes } from "types/ActionTypes";
import Weaver from "main";
import { Thread } from "interfaces/Thread";

interface ChatState {
    conversation: Conversation | null;
}

const initialChatState: ChatState = {
    conversation: null,
};

interface ThreadState {}

const initialThreadState: ThreadState = {};

interface WeaverState {
    chat: ChatState;
    thread: ThreadState;
}

const initialState: WeaverState = {
    chat: initialChatState,
    thread: initialThreadState,
};

interface ChatActions {
    type: ChatActionTypes.CREATE_CONVERSATION;
    payload: Conversation;
}

const chatReducer = (state: ChatState, action: ChatActions): ChatState => {
    switch (action.type) {
        case ChatActionTypes.CREATE_CONVERSATION:
            return { ...state, conversation: action.payload };
        default:
            return state;
    }
};

interface ThreadActions {
	type: ThreadActionTypes.LOAD_CONVERSATION;
    payload: Thread;
}

const threadReducer = (state: ThreadState, action: ThreadActions): ThreadState => {
    return state;
};

type Actions = ChatActions | ThreadActions;

const weaverReducer = (
    state: WeaverState,
    action: Actions
): WeaverState => {
    switch(action.type) {
        case ChatActionTypes.CREATE_CONVERSATION:
            return {
                ...state,
                chat: chatReducer(state.chat, action),
                thread: state.thread,
            };

        case ThreadActionTypes.LOAD_CONVERSATION:
            return {
                ...state,
                chat: state.chat,
                thread: threadReducer(state.thread, action),
            };

        default:
            return state;
    }
};

type WeaverContextType = [WeaverState, Dispatch<Actions>, ConversationManager];

const WeaverContext = createContext<WeaverContextType | undefined>(
    undefined
);

export const WeaverProvider: FC<{ children: ReactNode; plugin: Weaver }> = ({
    children,
    plugin,
}) => {
    const [state, dispatch] = useReducer(weaverReducer, initialState);
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
        throw new Error("useWeaver must be used within a WeaverProvider");
    }

    return context;
};
