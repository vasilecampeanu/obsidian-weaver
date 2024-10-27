import { autoUpdate, offset, useFloating } from "@floating-ui/react";
import { Icon } from "components/primitives/Icon";
import { AnimatePresence, motion } from "framer-motion";
import { useConversation } from "hooks/useConversation";
import { useLatestCreateTimeMap } from "hooks/useLatestCreateTimeMap";
import { IMessageNode } from "interfaces/IConversation";
import { usePlugin } from "providers/plugin/usePlugin";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { ChatMessageBubble } from "./ChatMessageBubble";

export const ChatDialogueFeed: React.FC = () => {
	const plugin = usePlugin();
	const { conversation, navigateToNode } = useConversation();
	const latestCreateTimeMap = useLatestCreateTimeMap(
		conversation?.mapping || {}
	);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(
		null
	);
	const boundaryRef = useRef<HTMLDivElement>(null);
	const endOfBoundaryRef = useRef<HTMLDivElement>(null);

	const [isAtBottom, setIsAtBottom] = useState(true);

	const { refs, floatingStyles } = useFloating({
		whileElementsMounted: autoUpdate,
		placement: "bottom-end",
		middleware: [offset(-40)],
	});

	useEffect(() => {
		if (boundaryRef.current) {
			refs.setReference(boundaryRef.current);
		}
	}, [boundaryRef, refs]);
	
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
					? (currentIndex - 1 + siblings.length) % siblings.length
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

			const isLatest = node.message?.author.role === "assistant" && index === lastAssistantIndex;

			if (node.message?.metadata.is_visually_hidden_from_conversation === true) return null;

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
					isEditing={editingMessageId === node.id}
					setEditingMessageId={setEditingMessageId}
					boundaryRef={boundaryRef}
				/>
			);
		});
	}, [path, getSortedSiblings, handleBranchNavigation, conversation, editingMessageId]);

	useEffect(() => {
		const handleScrollToEnd = () => {
			if (endOfBoundaryRef.current) {
				endOfBoundaryRef.current.scrollIntoView({ behavior: "smooth" });
			}
		};

		const debounceTimer = setTimeout(handleScrollToEnd, 300);

		return () => clearTimeout(debounceTimer);
	}, [path]);

	const handleScroll = useCallback(() => {
		const boundary = boundaryRef.current;
		if (!boundary) return;
		const { scrollTop, scrollHeight, clientHeight } = boundary;
		const threshold = 50;
		const atBottom = scrollHeight - scrollTop - clientHeight <= threshold;
		setIsAtBottom(atBottom);
	}, []);

	useEffect(() => {
		const boundary = boundaryRef.current;
		if (!boundary) return;
		boundary.addEventListener("scroll", handleScroll);
		handleScroll();
		return () => {
			boundary.removeEventListener("scroll", handleScroll);
		};
	}, [handleScroll]);

	const warningVariants = {
		initial: { opacity: 0, y: 0 },
		animate: { opacity: 1, y: 0 },
		exit:    { opacity: 0, y: 0 },
	};

	const scrollToBottom = useCallback(() => {
		if (endOfBoundaryRef.current) {
			endOfBoundaryRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);
	  
	return (
		<div
			ref={boundaryRef}
			className="ow-chat-dialogue-feed"
			style={{ overflowY: "auto", height: "100%" }}
		>
			<AnimatePresence>
				{path.length === 1 && plugin.settings.apiKey.trim() === "" && (
					<motion.div
						className="ow-info warning"
						variants={warningVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						transition={{ duration: 0.3 }}
					>
						<div className="ow-info-title">
							<Icon iconId="triangle-alert" />
							<span>API Key Required</span>
						</div>
						<div className="ow-info-msg">
							Please set your OpenAI API key in the plugin settings to enable chat functionality.
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			{renderMessages}
			{!isAtBottom && (
				<button
					ref={refs.setFloating}
					className="ow-floatting-btn"
					style={floatingStyles}
					onClick={scrollToBottom}
				>
					<Icon iconId={"arrow-down"} />
				</button>
			)}
			<div ref={endOfBoundaryRef} id="anchor" />
		</div>
	);
};
