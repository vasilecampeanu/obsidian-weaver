import { ConversationProps, ConversationState, DEFAULT_CONVERSATION_STATES } from "./store.slice.conversation";

export type WeaverStoreProps = ConversationProps;

export const DEFAULT_WEAVER_STORE_PROPS: WeaverStoreProps = {
	...DEFAULT_CONVERSATION_STATES,
}

export type WeaverStorePropsTypes = typeof DEFAULT_WEAVER_STORE_PROPS;
export type WeaverStoreSession = ConversationState;
