import { useWeaver } from "core/WeaverContext";
import { Conversation, Message } from "interfaces/Conversation";
import { ChatActionTypes } from "types/ActionTypes";

export const useChat = () => {
    const [state, dispatch, manager] = useWeaver();

    const createConversation = async () => {
        try {
            const conversation = await manager.createConversation();
            dispatch({ type: ChatActionTypes.CREATE_CONVERSATION, payload: conversation });
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const loadConversation = async (conversationId: string) => {
        try {
            const conversation = await manager.getConversationById(conversationId);
            dispatch({ type: ChatActionTypes.LOAD_CONVERSATION, payload: conversation });
        } catch (error) {
            console.error("Error loading conversation:", error);
        }
    };

    const addNewMessageToConversation = async (conversationId: string, content: string) => {
		try {
		    const conversation = await manager.addNewMessageToConversation(conversationId, content);
		    console.log("addNewMessageToConversation:", conversation);
            dispatch({ type: ChatActionTypes.ADD_MESSAGE, payload: conversation });
        } catch (error) {
		    console.error("Error adding message to conversation:", error);
		}
    };

	const updateCurrentNode = async (conversationId: string, newNodeId: string) => {
		try {
		    const conversation = await manager.updateCurrentNodeOfConversation(conversationId, newNodeId);
		    console.log("updateCurrentNode:", conversation);
            dispatch({ type: ChatActionTypes.UPDATE_CURRENT_NODE, payload: conversation });
        } catch (error) {
		    console.error("Error updating current node:", error);
		}
    };

    return {
        ...state.chat,
        createConversation,
		loadConversation,
		addNewMessageToConversation,
		updateCurrentNode
    };
};
