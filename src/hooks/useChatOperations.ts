import { useWeaver } from "components/chat/WeaverContext";
import { ActionTypes } from "types/ActionTypes";

export const useChatOperations = () => {
    const [state, dispatch, manager] = useWeaver();

    const createNewConversation = async () => {
        const newConversation = await manager.createNewConversation();
        dispatch({ type: ActionTypes.CREATE_CONVERSATION, payload: newConversation });
    };

    return {
        ...state,
        createNewConversation,
    };
};
