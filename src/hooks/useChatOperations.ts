import { useChat } from "components/chat/ChatContext";
import { ActionTypes } from "types/ActionTypes";

export const useChatOperations = () => {
    const [state, dispatch, manager] = useChat();

    const createNewConversation = async () => {
        const newConversation = await manager.createNewConversation();
        dispatch({ type: ActionTypes.CREATE_CONVERSATION, payload: newConversation });
    };

    return {
        ...state,
        createNewConversation,
    };
};
