import { EChatModels } from "enums/EProviders";
import { IContent, IConversation, IMessageNode, IMessageStatus } from "interfaces/IConversation";
import { IUserSelection } from "interfaces/IUserEvents";

const getCurrentTimestamp = () => Date.now() / 1000;

export const createMessageNode = (
	id: string,
	role: 'user' | 'assistant',
	content: IContent,
	parentId: string | null,
	metadata: any = {},
	modelSlug?: EChatModels,
	status: IMessageStatus = 'in_progress',
	endTurn: boolean = false
): IMessageNode => {
	const now = getCurrentTimestamp();
	return {
		id,
		message: {
			id,
			author: { role, name: null, metadata: {} },
			create_time: now,
			update_time: now,
			content,
			status,
			end_turn: endTurn,
			weight: 1.0,
			metadata: {
				...(role === 'assistant' && modelSlug ? { default_model_slug: modelSlug, model_slug: modelSlug } : {}),
				...metadata,
			},
			recipient: 'all',
			channel: null,
		},
		parent: parentId,
		children: [],
	};
};

export const buildParts = (selection: IUserSelection | null | undefined, userMessage: string): string[] => {
	if (selection?.text) {
		return ['user-selection: ', selection.text, ' user-input: ', userMessage];
	}

	return [userMessage];
};

export const addMessageNodeToConversation = (
	conversation: IConversation,
	messageNode: IMessageNode
): IConversation => {
	const { id: messageId, parent: parentId } = messageNode;
	const now = getCurrentTimestamp();

	return {
		...conversation,
		mapping: {
			...conversation.mapping,
			[messageId]: messageNode,
			...(parentId && {
				[parentId]: {
					...conversation.mapping[parentId],
					children: [...conversation.mapping[parentId].children, messageId],
				},
			}),
		},
		current_node: messageId,
		update_time: now,
	};
};

export const updateAssistantMessageNode = (
	conversation: IConversation,
	assistantMessageNode: IMessageNode,
	content: string,
	status: IMessageStatus,
	endTurn: boolean
): IConversation => {
	const now = getCurrentTimestamp();
	const assistantMessageNodeId = assistantMessageNode.id;

	const updatedAssistantNode: IMessageNode = {
		...assistantMessageNode,
		message: {
			...assistantMessageNode.message!,
			content: {
				...assistantMessageNode.message!.content,
				parts: [content],
			},
			status,
			end_turn: endTurn,
			update_time: now,
		},
	};

	return {
		...conversation,
		mapping: {
			...conversation.mapping,
			[assistantMessageNodeId]: updatedAssistantNode,
		},
		update_time: now,
	};
};
