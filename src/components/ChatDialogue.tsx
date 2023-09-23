import { Conversation } from 'interfaces/Conversation';
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import BranchSelector from './BranchSelector';
import MessageComponent from './MessageComponent';

const SYSTEM_ROLE = 'system';

interface ChatDialogueProps {
	conversation: Conversation | null;
}

export const ChatDialogue: React.FC<ChatDialogueProps> = ({ conversation }) => {
	const [selectedBranches, setSelectedBranches] = useState<Record<string, number>>({});
	const cache = useRef(new Map<string, number>());

	const handleLeft = useCallback((nodeId: string, currentIndex: number) => {
		setSelectedBranches(prev => ({ ...prev, [nodeId]: Math.max(0, currentIndex - 1) }));
		const newSelectedIndex = Math.max(0, currentIndex - 1);
		const newSelectedNodeId = conversation?.mapping?.[nodeId]?.children?.[newSelectedIndex];

		if (newSelectedNodeId) {
			const lastNodeId = getLastNodeIdInBranch(newSelectedNodeId);
			console.log("Last node ID in selected branch:", lastNodeId);
		}
	}, [conversation]);
	
	const handleRight = useCallback((nodeId: string, currentIndex: number, childrenLength: number) => {
		setSelectedBranches(prev => ({ ...prev, [nodeId]: Math.min(childrenLength - 1, currentIndex + 1) }));
		const newSelectedIndex = Math.min(childrenLength - 1, currentIndex + 1);
		const newSelectedNodeId = conversation?.mapping?.[nodeId]?.children?.[newSelectedIndex];

		if (newSelectedNodeId) {
			const lastNodeId = getLastNodeIdInBranch(newSelectedNodeId);
			console.log("Last node ID in selected branch:", lastNodeId);
		}
	}, [conversation]);
	
	useEffect(() => {
		cache.current.clear();
	}, [conversation, cache]);

	if (!conversation || !conversation.mapping) {
		return null;
	}

	const getLastNodeIdInBranch = (nodeId: string): string => {
		let currentNodeId = nodeId;
		let maxTime = getMostRecentMessageTime(nodeId);
	
		while (conversation.mapping?.[currentNodeId]?.children?.length) {
			let selectedChildId = conversation.mapping[currentNodeId].children[0];
			let selectedChildTime = getMostRecentMessageTime(selectedChildId);
	
			for (const childId of conversation.mapping[currentNodeId].children) {
				const childTime = getMostRecentMessageTime(childId);
				if (childTime > selectedChildTime) {
					selectedChildId = childId;
					selectedChildTime = childTime;
				}
			}
	
			currentNodeId = selectedChildId;
			if (selectedChildTime > maxTime) {
				maxTime = selectedChildTime;
			}
		}
	
		return currentNodeId;
	};	

	const getMostRecentMessageTime = (nodeId: string): number => {
		if (cache.current.has(nodeId)) {
			return cache.current.get(nodeId)!;
		}

		const node = conversation.mapping?.[nodeId];
		const time = node?.message?.create_time ?? 0;

		cache.current.set(nodeId, time);

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

		if (!node?.message) return [];

		const elements: JSX.Element[] = [<MessageComponent key={node.id} message={node.message} />];

		if (node.children.length > 1) {
			const currentIndex = selectedBranches[node.id] ?? selectBranch(nodeId);

			elements.push(
				<BranchSelector
					key={`selector-${node.id}`}
					currentIndex={currentIndex}
					totalBranches={node.children.length}
					onLeft={() => handleLeft(node.id, currentIndex)}
					onRight={() => handleRight(node.id, currentIndex, node.children.length)}
				/>
			);

			elements.push(...renderNode(node.children[currentIndex]));
		} else if (node.children.length === 1) {
			elements.push(...renderNode(node.children[0]));
		}

		return elements;
	};

	const systemNode = Object.values(conversation.mapping ?? {}).find(node => node?.message?.author?.role === SYSTEM_ROLE);

	if (!systemNode) return null;

	return <div>{renderNode(systemNode.id)}</div>;
};
