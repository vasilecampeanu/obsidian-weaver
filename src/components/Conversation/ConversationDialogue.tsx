import { IChatMessage, IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { ConversationMessageBubble } from "./ConversationMessageBubble";
import { ConversationManager } from "utils/ConversationManager";
import { ConversationEngineInfo } from "./ConversationEngineInfo";
import { ConversationRenderer } from "helpers/ConversationRenderer";

interface ConversationDialogueProps {
	plugin: Weaver;
	conversation: IConversation | undefined;
	setConversationSession: React.Dispatch<React.SetStateAction<IConversation | undefined>>;
}

export const ConversationDialogue: React.FC<ConversationDialogueProps> = ({
	plugin,
	conversation,
	setConversationSession
}) => {
	const [selectedChildren, setSelectedChildren] = useState<{ [key: string]: number }>({});
	const [activeEngine, setActiveEngine] = useState<"gpt-3.5-turbo" | "gpt-4">(plugin.settings.engine as any);
	const [showEngineInfo, setShowEngineInfo] = useState(false);
	
	const dialogueTimelineRef = useRef<HTMLDivElement>(null);
	const rootMessage = conversation?.messages.find((msg) => msg.role === "system");
	const TIMEOUT_DELAY = 250;

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowEngineInfo(true);
		}, TIMEOUT_DELAY);

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		const messageList = dialogueTimelineRef.current;

		if (messageList) {
			const observer = new MutationObserver(() => {
				messageList.scrollTop = messageList.scrollHeight;
			});

			observer.observe(messageList, { childList: true });

			return () => observer.disconnect();
		}
	}, [conversation?.messages?.length]);

	useEffect(() => {
		if (conversation) {
			const initialSelectedChildren: { [key: string]: number } = {};

			const findPathToCurrentNode = (messageId: string, path: string[]): string[] => {
				const message = conversation.messages.find(msg => msg.id === messageId);
				if (message) {
					if (message.children && message.children.length > 0) {
						for (let i = 0; i < message.children.length; i++) {
							const childId = message.children[i];
							if (childId === conversation.currentNode || findPathToCurrentNode(childId, [...path, messageId]).length > 0) {
								initialSelectedChildren[messageId] = i;
								return [...path, messageId];
							}
						}
					}
				}

				return [];
			}

			findPathToCurrentNode(conversation.messages.find(msg => msg.role === "system")?.id || '', []);
			setSelectedChildren(initialSelectedChildren);
		}
	}, [conversation]);

	const changeSelectedChild = async (messageId: string | undefined, increment: number) => {
		const message = conversation?.messages.find((msg) => msg.id === messageId);

		if (message && message.children) {
			let newIndex = (selectedChildren[messageId as string] || 0) + increment;
			if (newIndex < 0) {
				newIndex = 0;
			} else if (newIndex >= message.children.length) {
				newIndex = message.children.length - 1;
			}

			setSelectedChildren({ ...selectedChildren, [messageId as string]: newIndex });

			const findNewestMessage = (messageId: string): string => {
				const message = conversation?.messages.find((msg) => msg.id === messageId);
				let newestMessageId = messageId;
				let newestDate = new Date(message?.creationDate || 0);

				message?.children?.forEach((childId) => {
					const childMessage = conversation?.messages.find((msg) => msg.id === childId);
					const childDate = new Date(childMessage?.creationDate || 0);
					const childNewestMessageId = findNewestMessage(childId);

					if (childDate > newestDate) {
						newestDate = childDate;
						newestMessageId = childNewestMessageId;
					}
				});

				return newestMessageId;
			}

			const newNodeId = findNewestMessage(message.children[newIndex]);

			if (conversation) {
				const updatedConversation = { ...conversation, currentNode: newNodeId };
				setConversationSession(updatedConversation)
				await ConversationManager.updateConversation(plugin, updatedConversation);
			}
		}
	};

	const renderMessages = (messageId: string, previousMessage: IChatMessage | undefined = undefined): React.ReactNode => {
		const message: IChatMessage | undefined = conversation?.messages.find((msg) => msg.id === messageId);
		const renderer = new ConversationRenderer(conversation);

		if (!message) {
			return null;
		}

		const childIds = message.children || [];
		const selectedChildIndex = selectedChildren[messageId] || 0;
		const selectedPreviousChildIndex = selectedChildren[previousMessage?.id as string] || 0;

		if (message.role === "system") {
			return childIds[selectedChildIndex] && renderMessages(childIds[selectedChildIndex], message);
		}

		const messagesRendered = renderer.getRenderedMessages();
		const reverseMessages = messagesRendered.reverse();

		const lastUserMessage = reverseMessages.find(message => message.role === 'user');
		const lastAssistantMessage = reverseMessages.find(message => message.role === 'assistant');

		let contextDisplay = false;

		if (conversation?.context === false && ((message.id === lastUserMessage?.id) || (message.id === lastAssistantMessage?.id))) {
			contextDisplay = true;
		}

		return (
			<>
				<ConversationMessageBubble
					plugin={plugin}
					message={message}
					previousMessage={previousMessage}
					selectedChild={selectedPreviousChildIndex}
					onSelectedChildChange={(increment: number) => changeSelectedChild(previousMessage?.id, increment)}
					contextDisplay={contextDisplay}
				/>
				{childIds[selectedChildIndex] && renderMessages(childIds[selectedChildIndex], message)}
			</>
		);
	};

	const handleSetGPT3 = () => {
		setActiveEngine("gpt-3.5-turbo");
		plugin.settings.engine = "gpt-3.5-turbo";
		plugin.saveSettings();
	}

	const handleSetGPT4 = () => {
		setActiveEngine("gpt-4");
		plugin.settings.engine = "gpt-4";
		plugin.saveSettings();
	}

	return (
		<div className={`ow-conversation-dialogue ${conversation?.context === false ? "ow-context" : ""}`} ref={dialogueTimelineRef}>
			{
				conversation!?.messages.length > 1 ? (
					rootMessage && renderMessages(rootMessage.id)
				) : (
					showEngineInfo && (
						<div className="ow-message-empty-dialogue">
							<div className="ow-change-engine">
								<button
									className={activeEngine === "gpt-3.5-turbo" ? "ow-active" : ""}
									onClick={handleSetGPT3}
								>
									<div className="ow-icon">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
									</div>
									<span>
										GPT-3.5
									</span>
								</button>
								<button
									className={activeEngine === "gpt-4" ? "ow-active" : ""}
									onClick={handleSetGPT4}
								>
									<div className="ow-icon">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
									</div>
									<span>
										GPT-4
									</span>
								</button>
							</div>
							<ConversationEngineInfo plugin={plugin} activeEngine={activeEngine} />
						</div>
					)
				)
			}
		</div>
	);
};
