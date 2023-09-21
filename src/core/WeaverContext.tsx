import React, { createContext, useReducer, ReactNode, useContext, FC, Dispatch } from "react";
import { ConversationManager } from "utils/ConversationManager";
import Weaver from "main";
import { Actions, WeaverContextType, WeaverState } from "types/WeaverTypes";
import { initialChatState, chatReducer } from "reducer/ChatReducer";
import { initialThreadState, threadReducer } from "reducer/ThreadReducer";

const initialState: WeaverState = {
    chat: initialChatState,
    thread: initialThreadState,
};

const weaverReducer = (state: WeaverState, action: Actions): WeaverState => {
    return {
        chat: chatReducer(state.chat, action),
        thread: threadReducer(state.thread, action),
    };
};

const WeaverContext = createContext<WeaverContextType | undefined>(undefined);

export const WeaverProvider: FC<{ children: ReactNode; plugin: Weaver }> = ({ children, plugin }) => {
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
