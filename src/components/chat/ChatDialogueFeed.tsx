import { useConversation } from "hooks/useConversation";
import React, { useState } from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface ChatDialogueFeedProps {}

export const ChatDialogueFeed: React.FC<ChatDialogueFeedProps> = () => {
	const { conversation } = useConversation();
	const [branchIndices, setBranchIndices] = useState<{
		[key: string]: number;
	}>({});

	if (!conversation) {
		return <div>Loading conversation...</div>;
	}

	const renderMessages = () => {
		const messagesToRender: JSX.Element[] = [];

		const traverseNode = (nodeId: string) => {
			const node = conversation.mapping[nodeId];
			if (!node) return;

			// Skip system messages but process their children
			if (node.message?.author.role === "system") {
				// Process all children of the system message
				node.children.forEach((childId) => traverseNode(childId));
				return;
			}

			const childBranches = node.children;
			const hasBranches = childBranches.length > 1;
			const currentBranchIndex = branchIndices[nodeId] || 0;

			const handlePrevBranch = () => {
				setBranchIndices((prev) => ({
					...prev,
					[nodeId]:
						(currentBranchIndex - 1 + childBranches.length) %
						childBranches.length,
				}));
			};

			const handleNextBranch = () => {
				setBranchIndices((prev) => ({
					...prev,
					[nodeId]: (currentBranchIndex + 1) % childBranches.length,
				}));
			};

			messagesToRender.push(
				<ChatMessageBubble
					key={nodeId}
					messageNode={node}
					hasBranches={hasBranches}
					currentBranchIndex={currentBranchIndex}
					totalBranches={childBranches.length}
					onPrevBranch={handlePrevBranch}
					onNextBranch={handleNextBranch}
				/>
			);

			// Continue traversal with the selected child
			if (childBranches.length > 0) {
				const nextNodeId = childBranches[currentBranchIndex];
				traverseNode(nextNodeId);
			}
		};

		// Start traversal from root nodes
		const rootNodes = Object.values(conversation.mapping).filter(
			(node) => node.parent === null
		);

		rootNodes.forEach((rootNode) => {
			traverseNode(rootNode.id);
		});

		return messagesToRender;
	};

	return <div className="ow-chat-dialogue-feed">{renderMessages()}</div>;
};
