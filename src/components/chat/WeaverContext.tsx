import React, {
    createContext,
    useReducer,
    ReactNode,
    useContext,
    FC,
    Dispatch,
} from "react";
import { Conversation } from "interfaces/Conversation";
import { ConversationManager } from "utils/ConversationManager";
import { ActionTypes } from "types/ActionTypes";
import Weaver from "main";

// Define state for chat
interface ChatState {
    conversation: Conversation | null;
}

const initialChatState: ChatState = {
    conversation: null,
};

// Define state for thread (empty for now)
interface ThreadState {}

const initialThreadState: ThreadState = {};

// Define main state that encompasses chat and thread states
interface WeaverState {
    chat: ChatState;
    thread: ThreadState;
}

const initialState: WeaverState = {
    chat: initialChatState,
    thread: initialThreadState,
};

// Chat actions
interface ChatAction {
    type: ActionTypes.CREATE_CONVERSATION;
    payload: Conversation;
}

type Actions = ChatAction; // Add other actions as required

// Chat reducer
const chatReducer = (state: ChatState, action: Actions): ChatState => {
    switch (action.type) {
        case ActionTypes.CREATE_CONVERSATION:
            return { ...state, conversation: action.payload };
        default:
            return state;
    }
};

// Thread reducer (empty for now)
const threadReducer = (state: ThreadState, action: Actions): ThreadState => {
    return state; // Do nothing for now, add logic as needed
};

// Main weaver reducer combining chat and thread reducers
const weaverReducer = (
    state: WeaverState,
    action: Actions
): WeaverState => {
    return {
        chat: chatReducer(state.chat, action),
        thread: threadReducer(state.thread, action),
    };
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
