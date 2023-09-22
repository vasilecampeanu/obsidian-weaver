import { useWeaver } from "core/WeaverContext";
import { Conversation } from "interfaces/Conversation";
import { ChatActionTypes } from "types/ActionTypes";

export const useChatOperations = () => {
    const [state, dispatch, manager] = useWeaver();

    const createNewConversation = async () => {
        const newConversation = await manager.createNewConversation();
        dispatch({ type: ChatActionTypes.CREATE_CONVERSATION, payload: newConversation });
    };

    const addNewMessageToConversation = async () => {
        const newConversation = await manager.addNewMessageToConversation(state.chat.conversation as Conversation, 'Hello world!');
        dispatch({ type: ChatActionTypes.CREATE_CONVERSATION, payload: newConversation });
    };

    return {
        ...state.chat,
        createNewConversation,
		addNewMessageToConversation
    };
};
