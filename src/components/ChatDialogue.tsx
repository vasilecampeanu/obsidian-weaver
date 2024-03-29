import { Conversation } from 'interfaces/Conversation';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useChat } from 'hooks/useChat';
import { MessageBubble } from './MessageBubble';

const SYSTEM_ROLE = 'system';
const MAX_CACHE_SIZE = 99;

interface ChatDialogueProps {
	conversation: Conversation | null;
}

export const ChatDialogue: React.FC<ChatDialogueProps> = ({ conversation }) => {
	const [selectedBranches, setSelectedBranches] = useState<Record<string, number>>({});
	const { updateCurrentNode } = useChat();

	const cache = useRef(new Map<string, number>());
	const keysInOrder = useRef<string[]>([]);

	useEffect(() => {
		cache.current.clear();
	}, [conversation]);

	const handleLeft = useCallback(async (nodeId: string, currentIndex: number) => {
		setSelectedBranches(prev => ({ ...prev, [nodeId]: Math.max(0, currentIndex - 1) }));
	
		const newSelectedIndex = Math.max(0, currentIndex - 1);
		const newSelectedNodeId = conversation?.mapping?.[nodeId]?.children?.[newSelectedIndex];
	
		if (newSelectedNodeId) {
			const lastNodeId = getLastNodeIdInBranch(newSelectedNodeId);
			await updateCurrentNode(conversation?.id, lastNodeId);
			console.log("Last node ID in selected branch:", lastNodeId);
		}
	}, [conversation]);

	const handleRight = useCallback(async (nodeId: string, currentIndex: number, childrenLength: number) => {
		setSelectedBranches(prev => ({ ...prev, [nodeId]: Math.min(childrenLength - 1, currentIndex + 1) }));
	
		const newSelectedIndex = Math.min(childrenLength - 1, currentIndex + 1);
		const newSelectedNodeId = conversation?.mapping?.[nodeId]?.children?.[newSelectedIndex];
	
		if (newSelectedNodeId) {
			const lastNodeId = getLastNodeIdInBranch(newSelectedNodeId);
			await updateCurrentNode(conversation?.id, lastNodeId);
			console.log("Last node ID in selected branch:", lastNodeId);
		}
	}, [conversation]);		

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
			const index = keysInOrder.current.indexOf(nodeId);

			if (index > -1) {
				keysInOrder.current.splice(index, 1);
				keysInOrder.current.push(nodeId);
			}

			return cache.current.get(nodeId)!;
		}
	
		const node = conversation.mapping?.[nodeId];
		const time = node?.message?.create_time ?? 0;
	
		if (cache.current.size >= MAX_CACHE_SIZE) {
			const leastRecentlyUsedKey = keysInOrder.current.shift()!;
			cache.current.delete(leastRecentlyUsedKey);
		}
	
		cache.current.set(nodeId, time);
		keysInOrder.current.push(nodeId);

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

	const pathToCurrentNode = (nodeId: string, targetNodeId: string): string[] | null => {
		if (nodeId === targetNodeId) return [nodeId];

		const node = conversation?.mapping?.[nodeId];

		if (!node || !node.children) return null;

		for (const childId of node.children) {
			const pathFromChild = pathToCurrentNode(childId, targetNodeId);
			if (pathFromChild) return [nodeId, ...pathFromChild];
		}

		return null;
	};

	const renderNodeByPath = (
		nodeId: string, 
		path: string[], 
		userSelections: Record<string, number>, 
		parentNodeId?: string, 
		parentIndex?: number, 
		parentChildrenLength?: number
	): JSX.Element[] => {
		const node = conversation?.mapping?.[nodeId];
	
		if (!node || !node.message) return [];
	
		const nextNodeId = path.length > 1 ? path[1] : null;
		const currentIndex = userSelections[node.id] ?? (nextNodeId ? node.children.indexOf(nextNodeId) : selectBranch(nodeId));
	
		const elements: JSX.Element[] = [];

		if (node.message.author.role !== SYSTEM_ROLE) {
			elements.push(
				<MessageBubble
					key={`node-${node.id}`}
					message={node.message}
					parentNodeId={parentNodeId}
					parentIndex={parentIndex}
					parentChildrenLength={parentChildrenLength}
					handleLeft={handleLeft}
					handleRight={handleRight}
				/>
			);
		}
	
		const nextNode = node.children[currentIndex];
	
		if (nextNode) {
			const newPath = nextNodeId === nextNode ? path.slice(1) : [];
			elements.push(...renderNodeByPath(
				nextNode, 
				newPath, 
				userSelections, 
				nodeId, 
				currentIndex, 
				node.children.length
			));
		}
	
		return elements;
	};
	
	if (!conversation || !conversation.mapping || !conversation.current_node) {
		return null;
	}
	
	const systemNode = Object.values(conversation.mapping).find(node => node?.message?.author?.role === SYSTEM_ROLE);

	if (!systemNode) return null;
	
	const pathToCurrent = pathToCurrentNode(systemNode.id, conversation.current_node);

	if (!pathToCurrent) return null;
	
	return (
		<div className="ow-chat-dialogue">
			{renderNodeByPath(systemNode.id, pathToCurrent, selectedBranches)}
		</div>
	);
};
