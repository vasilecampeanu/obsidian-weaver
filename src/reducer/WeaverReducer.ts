import { Actions, WeaverContextType, WeaverState } from "types/WeaverTypes";
import { initialChatState, chatReducer } from "reducer/ChatReducer";
import { initialThreadState, threadReducer } from "reducer/ThreadReducer";

export const initialState: WeaverState = {
    chat: initialChatState,
    thread: initialThreadState,
};

export const weaverReducer = (state: WeaverState, action: Actions): WeaverState => {
    return {
        chat: chatReducer(state.chat, action),
        thread: threadReducer(state.thread, action),
    };
};
