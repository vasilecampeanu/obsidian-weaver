import { ChatGPTIcon } from "components/icons/ChatGPTIcon";
import { Icon } from "components/primitives/Icon";
import { useConversation } from "hooks/useConversation";
import { IMessageNode } from "interfaces/IConversation";
import { Component, MarkdownRenderer } from "obsidian";
import { usePlugin } from "providers/plugin/usePlugin";
import React, { useEffect, useState } from "react";

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
}) => {
	const app = usePlugin().app;
	const { regenerateAssistantMessage, editUserMessage, isGenerating } = useConversation();
	const [isCopied, setIsCopied] = useState(false);

	const [editedContent, setEditedContent] = useState(
		messageNode.message?.content.parts.join("\n") || ""
	);

	const [renderedContent, setRenderedContent] = useState<{
		__html: string;
	} | null>(null);

	const message = messageNode.message;

	useEffect(() => {
		if (!isEditing) {
			setEditedContent(message?.content.parts.join("\n") || "");
		}
	}, [isEditing, message]);

	useEffect(() => {
		if (!message) return;

		let isMounted = true;
		const container = document.createElement("div");
		const context = new Component();

		MarkdownRenderer.render(
			app,
			message.content.parts.join("\n"),
			container,
			"",
			context
		)
			.then(() => {
				if (isMounted) {
					setRenderedContent({ __html: container.innerHTML });
				}
				context.unload();
			})
			.catch((error) => {
				console.error("Markdown rendering failed:", error);
				if (isMounted) {
					setRenderedContent({
						__html: "<p>Error rendering content.</p>",
					});
				}
				context.unload();
			});

		return () => {
			isMounted = false;
			context.unload();
		};
	}, [message, app]);

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

		await editUserMessage(messageNode.id, editedContent.trim());
		setEditingMessageId(null);
	};

	return (
		<div
			className={`ow-chat-message-bubble ${message.author.role} ${
				isLatest ? "latest" : ""
			} ${isEditing ? "editing" : ""}`}
		>
			<div className="ow-message">
				<div className="ow-message-content">
					{isEditing ? (
						<div className="editing-area">
							<textarea
								value={editedContent}
								onChange={(e) =>
									setEditedContent(e.target.value)
								}
								rows={3}
								className="ow-edit-textarea"
							/>
							<div className="editing-buttons">
								<button
									className="ow-btn save"
									onClick={handleSaveEdit}
								>
									Save
								</button>
								<button
									className="ow-btn cancel"
									onClick={handleCancelEdit}
								>
									Cancel
								</button>
							</div>
						</div>
					) : message.author.role === "assistant" ? (
						<>
							<div className="ow-openai-icon">
								<ChatGPTIcon />
							</div>
							<div className="ow-parts">
								<div
									className="ow-rendered-content"
									dangerouslySetInnerHTML={
										renderedContent || { __html: "" }
									}
								/>
								{isGenerating && isLatest && (
									<>#</>
								)}
							</div>
						</>
					) : (
						<div
							className="ow-rendered-content"
							dangerouslySetInnerHTML={
								renderedContent || { __html: "" }
							}
						/>
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
			<div className="ow-message-utility-bar">
				{hasBranches && (
					<div className="ow-branch-navigation">
						<button
							className="ow-btn"
							onClick={onPrevBranch}
						>
							<Icon iconId={"chevron-left"} />
						</button>
						<span className="ow-branch-index">
							{currentBranchIndex + 1} / {totalBranches}
						</span>
						<button
							className="ow-btn"
							onClick={onNextBranch}
						>
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
							onClick={() =>
								regenerateAssistantMessage(messageNode.id)
							}
						>
							<Icon iconId={"refresh-ccw"} />
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
