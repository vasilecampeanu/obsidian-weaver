import { ThreadActionTypes } from "types/ActionTypes";
import { Actions, ThreadState } from "types/WeaverTypes";

export const initialThreadState: ThreadState = {
	thread: null
};

export const threadReducer = (state: ThreadState, action: Actions): ThreadState => {
    if (action.type in ThreadActionTypes) {
        switch (action.type) {
            case ThreadActionTypes.LOAD_CONVERSATIONS:
				return { ...state, thread: action.payload };
            default:
                return state;
        }
    }

    return state;
};
