import { ContextProps, ContextState, DEFAULT_CONTEXT_STATES } from "./store.slice.context";
import { ConversationProps, ConversationState, DEFAULT_CONVERSATION_STATES } from "./store.slice.conversation";

export type WeaverStoreProps = ContextProps & ConversationProps;

export const DEFAULT_WEAVER_STORE_PROPS: WeaverStoreProps = {
	...DEFAULT_CONVERSATION_STATES,
	...DEFAULT_CONTEXT_STATES
}

export type WeaverStorePropsTypes = typeof DEFAULT_WEAVER_STORE_PROPS;
export type WeaverStoreSession = ContextState & ConversationState;
