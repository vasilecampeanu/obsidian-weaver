import { useWeaver } from "core/WeaverContext";
import { Conversation, Message } from "interfaces/Conversation";
import { ChatActionTypes } from "types/ActionTypes";

export const useChat = () => {
    const [state, dispatch, manager] = useWeaver();

    const createConversation = async () => {
        const conversation = await manager.createConversation();
        dispatch({ type: ChatActionTypes.CREATE_CONVERSATION, payload: conversation });
    };

    const loadConversation = async (conversationId: string) => {
        const conversation = await manager.getConversationById(conversationId);
        dispatch({ type: ChatActionTypes.LOAD_CONVERSATION, payload: conversation });
    };

    const addNewMessageToConversation = async () => {
        const conversation = await manager.addNewMessageToConversation(state.chat.conversation as Conversation, 'Hello world!');
        dispatch({ type: ChatActionTypes.ADD_MESSAGE, payload: conversation });
    };

	const updateCurrentNode = async (conversationId: string, newNodeId: string) => {
        const conversation = await manager.updateCurrentNodeOfConversation(conversationId, newNodeId);
        dispatch({ type: ChatActionTypes.UPDATE_CURRENT_NODE, payload: conversation });
    };

    return {
        ...state.chat,
        createConversation,
		loadConversation,
		addNewMessageToConversation,
		updateCurrentNode
    };
};
