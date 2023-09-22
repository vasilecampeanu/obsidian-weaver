import { useWeaver } from "core/WeaverContext";
import { Conversation, Message } from "interfaces/Conversation";
import { ChatActionTypes } from "types/ActionTypes";

export const useChat = () => {
    const [state, dispatch, manager] = useWeaver();

    const createNewConversation = async () => {
        const newConversation = await manager.createNewConversation();
        dispatch({ type: ChatActionTypes.CREATE_CONVERSATION, payload: newConversation });
    };

    const loadConversation = async (conversationId: string) => {
        const conversation = await manager.getConversationById(conversationId);
		console.log(conversation);
        dispatch({ type: ChatActionTypes.LOAD_CONVERSATION, payload: conversation });
    };

    const addNewMessageToConversation = async () => {
        const newConversation = await manager.addNewMessageToConversation(state.chat.conversation as Conversation, 'Hello world!');
        dispatch({ type: ChatActionTypes.CREATE_CONVERSATION, payload: newConversation });
    };

	// TODO: This should probably be async
	const getRenderedMessages = () : Message[] => {
		return manager.getRenderedMessages(state.chat.conversation);
	}

    return {
        ...state.chat,
        createNewConversation,
		loadConversation,
		addNewMessageToConversation,
		getRenderedMessages
    };
};
