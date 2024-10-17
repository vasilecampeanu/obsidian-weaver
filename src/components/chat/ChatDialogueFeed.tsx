import { useConversation } from "hooks/useConversation";
import { useLatestCreateTimeMap } from "hooks/useLatestCreateTimeMap";
import { IMessageNode } from "interfaces/IConversation";
import React, { useCallback, useMemo } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";

export const ChatDialogueFeed: React.FC = () => {
	const { conversation, navigateToNode } = useConversation();

	const latestCreateTimeMap = useLatestCreateTimeMap(
		conversation?.mapping || {}
	);

	const path = useMemo(() => {
		if (!conversation?.current_node) return [];

		const tempPath: IMessageNode[] = [];
		let currentNodeId = conversation.current_node;

		while (currentNodeId) {
			const node = conversation.mapping[currentNodeId];
			if (!node) break;
			tempPath.unshift(node);
			currentNodeId = node.parent!;
		}

		return tempPath;
	}, [conversation]);

	const getSortedSiblings = useCallback(
		(parentNode: IMessageNode | null): IMessageNode[] => {
			if (!parentNode) return [];

			const siblings = parentNode.children
				.map((siblingId) => conversation?.mapping[siblingId])
				.filter((node): node is IMessageNode => node !== undefined)
				.sort(
					(a, b) =>
						(a.message?.create_time ?? 0) -
						(b.message?.create_time ?? 0)
				);

			return siblings;
		},
		[conversation]
	);

	const handleBranchNavigation = useCallback(
		async (
			siblings: IMessageNode[],
			currentIndex: number,
			direction: "prev" | "next"
		) => {
			if (siblings.length === 0) return;

			const newIndex =
				direction === "prev"
					? (currentIndex - 1  + siblings.length) % siblings.length
					: (currentIndex + 1) % siblings.length;

			let newBranchNode = siblings[newIndex];

			while (newBranchNode.children.length > 0) {
				const childNodes = newBranchNode.children
					.map((childId) => conversation?.mapping[childId])
					.filter((node): node is IMessageNode => node !== undefined)
					.sort(
						(a, b) =>
							(latestCreateTimeMap[b.id] ?? 0) -
							(latestCreateTimeMap[a.id] ?? 0)
					);

				if (childNodes.length === 0) break;

				newBranchNode = childNodes[0];
			}

			await navigateToNode(newBranchNode.id);
		},
		[conversation, navigateToNode, latestCreateTimeMap]
	);

	const renderMessages = useMemo(() => {
		if (!path.length) return null;

		const lastAssistantIndex = path
			.map((node, index) => ({ node, index }))
			.reverse()
			.find(
				({ node }) => node.message?.author.role === "assistant"
			)?.index;

		return path.map((node, index) => {
			const parentNode = node.parent
				? conversation?.mapping[node.parent] || null
				: null;
			const siblings = getSortedSiblings(parentNode);
			const hasBranches = siblings.length > 1;
			const currentBranchIndex = siblings.findIndex(
				(sibling) => sibling.id === node.id
			);
			const totalBranches = siblings.length;

			const handlePrevBranch = () => handleBranchNavigation(siblings, currentBranchIndex, "prev");
			const handleNextBranch = () => handleBranchNavigation(siblings, currentBranchIndex, "next");

			const isLatest =
				node.message?.author.role === "assistant" &&
				index === lastAssistantIndex;

			return (
				<ChatMessageBubble
					key={node.id}
					messageNode={node}
					hasBranches={hasBranches}
					currentBranchIndex={currentBranchIndex}
					totalBranches={totalBranches}
					onPrevBranch={handlePrevBranch}
					onNextBranch={handleNextBranch}
					isLatest={isLatest}
				/>
			);
		});
	}, [path, getSortedSiblings, handleBranchNavigation, conversation]);

	return <div className="ow-chat-dialogue-feed">{renderMessages}</div>;
};
