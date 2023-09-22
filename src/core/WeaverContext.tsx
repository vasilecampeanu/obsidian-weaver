import React, { createContext, useReducer, ReactNode, useContext, FC, Dispatch } from "react";
import { ConversationManager } from "utils/ConversationManager";
import Weaver from "main";
import { WeaverContextType } from "types/WeaverTypes";
import { initialState, weaverReducer } from "reducer/WeaverReducer";

const WeaverContext = createContext<WeaverContextType | undefined>(undefined);

export const WeaverProvider: FC<{ children: ReactNode; plugin: Weaver }> = ({ children, plugin }) => {
    const [state, dispatch] = useReducer(weaverReducer, initialState);
    const manager = new ConversationManager(plugin);

    return (
        <WeaverContext.Provider value={[state, dispatch, manager]}>
            {children}
        </WeaverContext.Provider>
    );
};

export const useWeaver = (): WeaverContextType => {
    const context = useContext(WeaverContext);

	if (!context) {
        throw new Error("useWeaver must be used within a WeaverProvider");
    }

    return context;
};
