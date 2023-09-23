import { Conversation } from 'interfaces/Conversation';
import React, { useState, useMemo } from 'react';
import BranchSelector from './BranchSelector';
import MessageComponent from './MessageComponent';

interface ConversationDialogueProps {
	conversation: Conversation | null;
}

export const ConversationDialogue: React.FC<ConversationDialogueProps> = ({ conversation }) => {
	const [selectedBranches, setSelectedBranches] = useState<Record<string, number>>({});
	const cache = useMemo(() => new Map<string, number>(), []);

	if (!conversation) {
		return null;
	}

	const getMostRecentMessageTime = (nodeId: string): number => {
		if (cache.has(nodeId)) {
			return cache.get(nodeId)!;
		}

		const node = conversation.mapping?.[nodeId];
		const time = node?.message?.create_time ?? 0;

		cache.set(nodeId, time);

		return time;
	};

	const selectBranch = (nodeId: string): number => {
		const children = conversation.mapping?.[nodeId]?.children ?? [];

		if (children.length <= 1) return 0;

		let maxTime = 0;
		let selectedIndex = 0;

		children.forEach((childId, index) => {
			const time = getMostRecentMessageTime(childId);
			if (time > maxTime) {
				maxTime = time;
				selectedIndex = index;
			}
		});

		return selectedIndex;
	};

	const renderNode = (nodeId: string): JSX.Element[] => {
		const node = conversation.mapping?.[nodeId];

		if (!node || !node.message) return [];

		const elements = [<MessageComponent key={node.id} message={node.message} />];

		if (node.children.length > 1) {
			const currentIndex = selectedBranches[node.id] ?? selectBranch(node.id);

			elements.push(
				<BranchSelector
					key={`selector-${node.id}`}
					currentIndex={currentIndex}
					totalBranches={node.children.length}
					onLeft={() => setSelectedBranches(prev => ({ ...prev, [node.id]: Math.max(0, currentIndex - 1) }))}
					onRight={() => setSelectedBranches(prev => ({ ...prev, [node.id]: Math.min(node.children.length - 1, currentIndex + 1) }))}
				/>
			);

			elements.push(...renderNode(node.children[currentIndex]));
		} else if (node.children.length === 1) {
			elements.push(...renderNode(node.children[0]));
		}

		return elements;
	};

	const systemNode = Object.values(conversation.mapping ?? {}).find(node => node?.message?.author?.role === 'system');

	if (!systemNode) {
		return null;
	}

	return (
		<div>
			{renderNode(systemNode.id)}
		</div>
	);
};
