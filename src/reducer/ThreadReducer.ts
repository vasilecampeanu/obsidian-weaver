import { ThreadActionTypes } from "types/ActionTypes";
import { Actions, ThreadState } from "types/WeaverTypes";

export const initialThreadState: ThreadState = {};

export const threadReducer = (state: ThreadState, action: Actions): ThreadState => {
    if (action.type in ThreadActionTypes) {
        switch (action.type) {
            case ThreadActionTypes.LOAD_CONVERSATION:
                // loading logic here...
                return state;
            default:
                return state;
        }
    }
    return state;
};
