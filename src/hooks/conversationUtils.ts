import { EChatModels } from 'enums/EProviders';
import { IContentType, IConversation, IMessageNode } from 'interfaces/IConversation';
import { v4 as uuidv4 } from 'uuid';

export const createUserMessageNode = (
	content: string[],
	contentType: IContentType,
	parentId: string | null
): IMessageNode => {
	const nodeId = uuidv4();
	const now = Date.now() / 1000;

	return {
		id: nodeId,
		message: {
			id: nodeId,
			author: { role: 'user', name: null, metadata: {} },
			create_time: now,
			update_time: now,
			content: {
				content_type: contentType,
				parts: [...content]
			},
			status: 'finished_successfully',
			end_turn: true,
			weight: 1.0,
			metadata: {},
			recipient: 'all',
			channel: null,
		},
		parent: parentId,
		children: [],
	};
};

export const createAssistantMessageNode = (
	parentId: string,
	defaultModelSlug: EChatModels,
	modelSlug?: EChatModels
): IMessageNode => {
	const nodeId = uuidv4();
	const now = Date.now() / 1000;

	return {
		id: nodeId,
		message: {
			id: nodeId,
			author: { role: 'assistant', name: null, metadata: {} },
			create_time: now,
			update_time: now,
			content: {
				content_type: 'text',
				parts: [''],
			},
			status: 'in_progress',
			end_turn: false,
			weight: 1.0,
			metadata: {
				default_model_slug: defaultModelSlug,
				model_slug: modelSlug || defaultModelSlug,
			},
			recipient: 'all',
			channel: null,
		},
		parent: parentId,
		children: [],
	};
};

export const updateConversationMapping = (
	conversation: IConversation,
	newNode: IMessageNode,
	parentNodeId: string | null
): IConversation => {
	const now = Date.now() / 1000;

	return {
		...conversation,
		mapping: {
			...conversation.mapping,
			[newNode.id]: newNode,
			...(parentNodeId && {
				[parentNodeId]: {
					...conversation.mapping[parentNodeId],
					children: [
						...conversation.mapping[parentNodeId].children,
						newNode.id,
					],
				},
			}),
		},
		current_node: newNode.id,
		update_time: now,
	};
};

export const getConversationPathToNode = (
	conversation: IConversation,
	nodeId: string
): IMessageNode[] => {
	const path: IMessageNode[] = [];
	let currentNodeId = nodeId;

	while (currentNodeId) {
		const node = conversation.mapping[currentNodeId];

		if (!node) break;

		path.unshift(node);

		currentNodeId = node.parent!;
	}

	return path;
};
