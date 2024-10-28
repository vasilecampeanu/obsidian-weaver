import { ChatGPTIcon } from "components/icons/ChatGPTIcon";
import { Icon } from "components/primitives/Icon";
import { MarkdownContent } from "components/primitives/MarkdownContent";
import { motion } from "framer-motion";
import { useConversation } from "hooks/useConversation";
import { IMessageNode } from "interfaces/IConversation";
import React, { useEffect, useRef, useState } from "react";
import { ChatModelSwitcher } from "./ChatModelSwitcher";

interface ChatMessageBubbleProps {
	messageNode: IMessageNode;
	hasBranches: boolean;
	currentBranchIndex: number;
	totalBranches: number;
	onPrevBranch: () => void;
	onNextBranch: () => void;
	isLatest?: boolean;
	isEditing: boolean;
	setEditingMessageId: (id: string | null) => void;
	boundaryRef: React.RefObject<HTMLElement>;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
	messageNode,
	hasBranches,
	currentBranchIndex,
	totalBranches,
	onPrevBranch,
	onNextBranch,
	isLatest,
	isEditing,
	setEditingMessageId,
	boundaryRef,
}) => {
	const { generateAssistantMessage, editUserMessage, isGenerating } = useConversation();
	const [isCopied, setIsCopied] = useState(false);
	const [editedContent, setEditedContent] = useState("");
	const [isChatModelSwitcherOpen, setIsChatModelSwitcherOpen] = useState(false);
	const regenerateButtonRef = useRef<HTMLButtonElement>(null);
	const [isHovered, setIsHovered] = useState(false);

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const message = messageNode.message;

	useEffect(() => {
		if (!isEditing) {
			if (!(message?.content.content_type === "text-with-user-selection")) {
				setEditedContent(message?.content.parts.join("\n") || "");
			} else {
				setEditedContent(message?.content.parts[3] || "");
			}
		}
	}, [isEditing, message]);

	useEffect(() => {
		if (isEditing && textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [editedContent, isEditing]);

	if (!message) return null;

	const handleCopyClick = () => {
		navigator.clipboard.writeText(message.content.parts.join("\n"));
		setIsCopied(true);
		setTimeout(() => {
			setIsCopied(false);
		}, 1500);
	};

	const handleEditClick = () => {
		setEditingMessageId(messageNode.id);
	};

	const handleCancelEdit = () => {
		setEditingMessageId(null);
	};

	const handleSaveEdit = async () => {
		if (editedContent.trim() === "") {
			return;
		}

		if (message.content.content_type === "text-with-user-selection") {
			const updatedParts = [...message.content.parts];
			updatedParts[3] = editedContent.trim();
			await editUserMessage(messageNode.id, message.content.content_type, updatedParts);
		} else {
			await editUserMessage(
				messageNode.id,
				message.content.content_type,
				[editedContent.trim()]
			);
		}

		setEditingMessageId(null);
	};

	const togglePopover = () => {
		setIsChatModelSwitcherOpen((prev) => !prev);
	};

	return (
		<div
			className={`ow-chat-message-bubble ${message.author.role} ${isLatest ? "latest" : ""} ${isEditing ? "editing" : ""}`}
		>
			<div className="ow-message">
				<div className="ow-message-content">
					{isEditing ? (
						<div className="editing-area">
							<textarea
								ref={textareaRef}
								value={editedContent}
								onChange={(e) =>
									setEditedContent(e.target.value)
								}
								className="ow-edit-textarea"
								rows={1}
							/>
							<div className="editing-buttons">
								<button
									className="ow-btn cancel"
									onClick={handleCancelEdit}
								>
									Cancel
								</button>
								<button
									className="ow-btn save"
									onClick={handleSaveEdit}
								>
									Save
								</button>
							</div>
						</div>
					) : message.author.role === "assistant" ? (
						<>
							<div className="ow-openai-icon">
								<ChatGPTIcon />
							</div>
							<div className="ow-parts">
								<MarkdownContent
									content={message.content.parts.join("\n")}
								/>
								{isGenerating && isLatest && <>#</>}
							</div>
						</>
					) : (
						<>
							{message.content.content_type === "text-with-user-selection" ? (
								<div className="text-with-user-selection">
									<div className="ow-user-selection">
										<span>Selected content</span>
										<MarkdownContent
											content={message.content.parts[1]}
										/>
									</div>
									<div className="ow-user-text">
										<MarkdownContent
											content={message.content.parts[3]}
										/>
									</div>
								</div>
							) : (
								<MarkdownContent
									content={message.content.parts.join("\n")}
								/>
							)}
						</>
					)}
				</div>
				{message.author.role === "user" && !isEditing && (
					<div className="ow-user-actions">
						<button
							className="ow-btn edit"
							onClick={handleEditClick}
						>
							<Icon iconId={"pen"} />
						</button>
					</div>
				)}
			</div>
			<div
				className={`ow-message-utility-bar ${
					isChatModelSwitcherOpen ? "model-switcher-open" : ""
				}`}
			>
				{hasBranches && (
					<div className="ow-branch-navigation">
						<button className="ow-btn" onClick={onPrevBranch}>
							<Icon iconId={"chevron-left"} />
						</button>
						<span className="ow-branch-index">
							{currentBranchIndex + 1} / {totalBranches}
						</span>
						<button className="ow-btn" onClick={onNextBranch}>
							<Icon iconId={"chevron-right"} />
						</button>
					</div>
				)}
				{message.author.role === "assistant" && (
					<div className="ow-user-actions">
						<button
							className="ow-btn copy"
							onClick={handleCopyClick}
						>
							<Icon iconId={isCopied ? "check" : "copy"} />
						</button>
						<button
							className="ow-btn regenerate"
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
							onClick={togglePopover}
							ref={regenerateButtonRef}
						>
							<div>
								<Icon iconId={"refresh-ccw"} />
							</div>
							{isHovered && (
								<motion.span
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.3 }}
									className="ow-model-slug"
								>
									{message.metadata.model_slug?.toUpperCase()}
								</motion.span>
							)}
							<div>
								<Icon iconId={"chevron-down"} />
							</div>
						</button>
						<ChatModelSwitcher
							referenceElement={regenerateButtonRef}
							boundaryRef={boundaryRef}
							isChatModelSwitcherOpen={isChatModelSwitcherOpen}
							setIsChatModelSwitcherOpen={
								setIsChatModelSwitcherOpen
							}
							currentModel={message.metadata.model_slug}
							onSelect={(model) => generateAssistantMessage('', null, message.id, model)}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
