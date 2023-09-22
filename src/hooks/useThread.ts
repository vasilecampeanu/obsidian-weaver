import { useWeaver } from "core/WeaverContext";
import { ThreadActionTypes } from "types/ActionTypes";

export const useThread = () => {
    const [state, dispatch, manager] = useWeaver();

    const getAllConversations = async () => {
        const thread = await manager.getAllConversations();
        dispatch({ type: ThreadActionTypes.LOAD_CONVERSATIONS, payload: thread });
    };

    return {
        ...state.thread,
		getAllConversations
    };
};
