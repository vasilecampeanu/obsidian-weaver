import { useWeaver } from "components/chat/WeaverContext";
import { ChatActionTypes } from "types/ActionTypes";

export const useChatOperations = () => {
    const [state, dispatch, manager] = useWeaver();

    const createNewConversation = async () => {
        const newConversation = await manager.createNewConversation();
        dispatch({ type: ChatActionTypes.CREATE_CONVERSATION, payload: newConversation });
    };

    return {
        ...state.chat,
        createNewConversation,
    };
};
