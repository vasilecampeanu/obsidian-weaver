import { useConversation } from "hooks/useConversation";
import { IMessageNode } from "interfaces/IConversation";
import React from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";

export const ChatDialogueFeed: React.FC = () => {
	const { conversation, navigateToNode } = useConversation();

	if (!conversation) {
		return <div>Loading conversation...</div>;
	}

	const renderMessages = () => {
		if (!conversation.current_node) {
			return [];
		}

		const path: IMessageNode[] = [];

		let currentNodeId = conversation.current_node;

		// Build the path from current_node back to the root
		while (currentNodeId) {
			const node = conversation.mapping[currentNodeId];
			if (!node) break;

			path.unshift(node); // Prepend to build the path in order from root to current_node

			currentNodeId = node.parent!;
		}

		const messagesToRender = path.map((node) => {
			const parentNode = node.parent
				? conversation.mapping[node.parent]
				: null;
			const siblings = parentNode ? parentNode.children : [];

			const hasBranches = siblings.length > 1;

			const siblingsNodes = siblings.map(
				(siblingId) => conversation.mapping[siblingId]
			);

			// Sort siblings by create_time (ascending)
			siblingsNodes.sort(
				(a, b) =>
					(a.message?.create_time ?? 0) -
					(b.message?.create_time ?? 0)
			);

			const currentBranchIndex = siblingsNodes.findIndex(
				(n) => n.id === node.id
			);

			const handlePrevBranch = async () => {
				if (!parentNode) return;

				const newIndex =
					(currentBranchIndex - 1 + siblingsNodes.length) %
					siblingsNodes.length;
				const newBranchNode = siblingsNodes[newIndex];

				// Traverse down the new branch to find its leaf node
				let newCurrentNode = newBranchNode;
				while (newCurrentNode.children.length > 0) {
					const childNodes = newCurrentNode.children.map(
						(childId) => conversation.mapping[childId]
					);
					childNodes.sort(
						(a, b) =>
							(a.message?.create_time ?? 0) -
							(b.message?.create_time ?? 0)
					);
					newCurrentNode = childNodes[childNodes.length - 1];
				}

				await navigateToNode(newCurrentNode.id);
			};

			const handleNextBranch = async () => {
				if (!parentNode) return;

				const newIndex =
					(currentBranchIndex + 1) % siblingsNodes.length;
				const newBranchNode = siblingsNodes[newIndex];

				// Traverse down the new branch to find its leaf node
				let newCurrentNode = newBranchNode;
				while (newCurrentNode.children.length > 0) {
					const childNodes = newCurrentNode.children.map(
						(childId) => conversation.mapping[childId]
					);
					childNodes.sort(
						(a, b) =>
							(a.message?.create_time ?? 0) -
							(b.message?.create_time ?? 0)
					);
					newCurrentNode = childNodes[childNodes.length - 1];
				}

				await navigateToNode(newCurrentNode.id);
			};

			return (
				<ChatMessageBubble
					key={node.id}
					messageNode={node}
					hasBranches={hasBranches}
					currentBranchIndex={currentBranchIndex}
					totalBranches={siblings.length}
					onPrevBranch={handlePrevBranch}
					onNextBranch={handleNextBranch}
				/>
			);
		});

		return messagesToRender;
	};

	return <div className="ow-chat-dialogue-feed">{renderMessages()}</div>;
};
