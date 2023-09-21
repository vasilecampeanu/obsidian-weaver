import { useChat } from "components/chat/ChatContext";

export const useChatOperations = () => {
    const [state, dispatch, manager] = useChat();

    const createNewConversation = async () => {
        const newConversation = await manager.createNewConversation();
        dispatch({ type: 'CREATE_CONVERSATION', payload: newConversation });
    };

    return {
        ...state,
        createNewConversation,
    };
};
