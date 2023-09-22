import { Conversation } from "interfaces/Conversation";
import { ChatActionTypes, ThreadActionTypes } from "types/ActionTypes";
import { ConversationManager } from "utils/ConversationManager";
import { Dispatch } from "react";

export interface ChatState {
    conversation: Conversation | null;
}

export type ChatActions = {
    type: ChatActionTypes.CREATE_CONVERSATION;
    payload: Conversation;
} | {
    type: ChatActionTypes.ADD_MESSAGE;
    payload: Conversation;
};

export interface ThreadState {
	thread: Conversation[] | null;
}

export type ThreadActions = {
    type: ThreadActionTypes.LOAD_CONVERSATIONS;
    payload: Conversation[];
};

export type Actions = ChatActions | ThreadActions;

export interface WeaverState {
    chat: ChatState;
    thread: ThreadState;
}

export type WeaverContextType = [WeaverState, Dispatch<Actions>, ConversationManager];
