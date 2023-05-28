import { IChatMessage, IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { ConversationMessageBubble } from "./ConversationMessageBubble";
import { ConversationManager } from "utils/ConversationManager";
import { ConversationEngineInfo } from "./ConversationEngineInfo";
import { ConversationRenderer } from "helpers/ConversationRenderer";
import MessageRenderer from "./ConversationMessageRenderer";

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
	const [activeEngine, setActiveEngine] = useState<"gpt-3.5-turbo" | "gpt-4">();
	const [activeMode, setActiveMode] = useState<"creative" | "balanced" | "precise">();
	const [showEngineInfo, setShowEngineInfo] = useState(false);
	const [showConversationEngineInfo, setShowConversationEngineInfo] = useState(plugin.settings.engineInfo);

	const dialogueTimelineRef = useRef<HTMLDivElement>(null);
	const rootMessage = conversation?.messages.find((msg) => msg.role === "system");
	const TIMEOUT_DELAY = 250;

	useEffect(() => {
		setActiveEngine(conversation?.model as "gpt-3.5-turbo" | "gpt-4")
		setActiveMode(conversation?.mode as "creative" | "balanced" | "precise")
	}, [conversation?.model, conversation?.mode])

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

	const handleSetGPT3 = async () => {
		setActiveEngine("gpt-3.5-turbo");

		if (conversation) {
			const updatedConversation = { ...conversation, model: "gpt-3.5-turbo" };
			setConversationSession(updatedConversation)
			await ConversationManager.updateConversationModel(plugin, conversation!?.id, "gpt-3.5-turbo");
		}
	}

	const handleSetGPT4 = async () => {
		setActiveEngine("gpt-4");

		if (conversation) {
			const updatedConversation = { ...conversation, model: "gpt-4" };
			setConversationSession(updatedConversation)
			await ConversationManager.updateConversationModel(plugin, conversation!?.id, "gpt-4");
		}
	}

	const handleShowInfoClick = async () => {
		setShowConversationEngineInfo(!showConversationEngineInfo);
		plugin.settings.engineInfo = true;
		await plugin.saveSettings();
	};

	const handleHideInfoClick = async () => {
		setShowConversationEngineInfo(!showConversationEngineInfo);
		plugin.settings.engineInfo = false;
		await plugin.saveSettings();
	};

	const handleModeChange = async (newMode: string) => {
		setActiveMode(newMode as "creative" | "balanced" | "precise");

		let systemPromptContent = ""

		if (newMode === "creative") {
			systemPromptContent = plugin.settings.creativeSystemRolePrompt;
		} else if (newMode === "balanced") {
			systemPromptContent = plugin.settings.balancedSystemRolePrompt;
		} else if (newMode === "precise") {
			systemPromptContent = plugin.settings.preciseSystemRolePrompt;
		}

		if (conversation) {
			const updatedConversation = { ...conversation, mode: newMode };

			// Update the system message content in the updated conversation
			const systemPrompt = updatedConversation.messages.find(message => message.role === 'system');

			if (systemPrompt) {
				systemPrompt.content = systemPromptContent; // update to your desired content
			}

			setConversationSession(updatedConversation);

			await ConversationManager.updateSystemPrompt(plugin, conversation!?.id, systemPromptContent);
			await ConversationManager.updateConversationMode(plugin, conversation!?.id, newMode);
		}
	};	

	return (
		<div className={`ow-conversation-dialogue ${conversation?.context === false ? "ow-context" : ""}`} ref={dialogueTimelineRef}>
			{
				conversation!?.messages.length > 1 ? (
					rootMessage && (
						<MessageRenderer
							messageId={rootMessage.id}
							selectedChildren={selectedChildren}
							changeSelectedChild={changeSelectedChild}
							conversation={conversation}
							plugin={plugin}
						/>
					)
				) : (
					showEngineInfo && (
						<div className="ow-message-empty-dialogue">
							<div className="ow-change-engine">
								<div
									className={`ow-btn-change-model ${activeEngine === "gpt-3.5-turbo" ? "ow-active" : ""}`}
									onClick={handleSetGPT3}
								>
									<div className="ow-icon">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
									</div>
									<div className="ow-engine-wrapper">
										<span>
											GPT-3.5
										</span>
										{showConversationEngineInfo === true ? (
											<button
												className="ow-btn-show-info"
												onClick={handleHideInfoClick}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
											</button>
										) : (
											<button
												className="ow-btn-show-info"
												onClick={handleShowInfoClick}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
											</button>
										)}
									</div>
								</div>
								<div
									className={`ow-btn-change-model ${activeEngine === "gpt-4" ? "ow-active" : ""}`}
									onClick={handleSetGPT4}
								>
									<div className="ow-icon">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
									</div>
									<div className="ow-engine-wrapper">
										<span>
											GPT-4
										</span>
										{showConversationEngineInfo === true ? (
											<button
												className="ow-btn-show-info"
												onClick={handleHideInfoClick}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
											</button>
										) : (
											<button
												className="ow-btn-show-info"
												onClick={handleShowInfoClick}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
											</button>
										)}
									</div>
								</div>
							</div>
							{showConversationEngineInfo && <ConversationEngineInfo plugin={plugin} activeEngine={activeEngine as "gpt-3.5-turbo" | "gpt-4"} />}
							<div className={`ow-change-mode ${showConversationEngineInfo === true ? "showConversationEngineInfoEnabled" : ""}`}>
								<div className="ow-title">
									Choose a conversation style
								</div>
								<div className="ow-mode-list">
									<button
										className={`ow-mode-wrapper ${activeMode === "creative" ? "active" : ""}`}
										onClick={() => handleModeChange("creative")}
									>
										<span className="ow-more">More</span>
										<span className="ow-mode">Creative</span>
									</button>
									<button
										className={`ow-mode-wrapper ${activeMode === "balanced" ? "active" : ""}`}
										onClick={() => handleModeChange("balanced")}
									>
										<span className="ow-more">More</span>
										<span className="ow-mode">Balanced</span>
									</button>
									<button
										className={`ow-mode-wrapper ${activeMode === "precise" ? "active" : ""}`}
										onClick={() => handleModeChange("precise")}
									>
										<span className="ow-more">More</span>
										<span className="ow-mode">Precise</span>
									</button>
								</div>
							</div>

						</div>
					)
				)
			}
		</div>
	);
};
