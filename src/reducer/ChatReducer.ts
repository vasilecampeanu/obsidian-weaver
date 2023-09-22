import { Conversation } from "interfaces/Conversation";
import { ChatActionTypes } from "types/ActionTypes";
import { Actions, ChatState } from "types/WeaverTypes";

export const initialChatState: ChatState = {
    conversation: null,
};

export const chatReducer = (state: ChatState, action: Actions): ChatState => {
    if (action.type in ChatActionTypes) {
        switch (action.type) {
            case ChatActionTypes.CREATE_CONVERSATION:
                return { ...state, conversation: action.payload };
            case ChatActionTypes.ADD_MESSAGE:
                return { ...state, conversation: action.payload };
            default:
                return state;
        }
    }

    return state;
};
