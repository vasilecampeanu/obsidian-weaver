import { IChatMessage, IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { ConversationManager } from "utils/ConversationManager";
import { OpenAIMessageDispatcher } from "utils/api/OpenAIMessageDispatcher";
import { ConversationSelectedText } from "./ConversationSelectedText";
import { eventEmitter } from "utils/EventEmitter";
import { ConversationSuggestedQuestions } from "./ConversationSuggestedQuestions";

interface ConversationInput {
	plugin: Weaver;
	conversation: IConversation | undefined;
	setConversationSession: React.Dispatch<React.SetStateAction<IConversation | undefined>>;
	onConversationLoad: (conversation: IConversation) => void;
	onTabSwitch: (tabId: string) => void;
}

export const ConversationInput: React.FC<ConversationInput> = ({
	plugin,
	conversation,
	setConversationSession,
	onConversationLoad
}) => {
	const [inputText, setInputText] = useState<string>("");
	const [isPinned, setIsPinned] = useState<Boolean>(false);
	const [showButton, setShowButton] = useState(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedText, setSelectedText] = useState("");

	useEffect(() => {
		const handleTextSelected = (text: string) => setSelectedText(text);
		eventEmitter.on("textSelected", handleTextSelected);
		return () => eventEmitter.off("textSelected", handleTextSelected);
	}, []);

	// Create a ref for your dispatcher
	const messageDispatcherRef = useRef<OpenAIMessageDispatcher | null>(null);

	const updateConversation = async (newMessage: IChatMessage, callback: (updatedMessages: IChatMessage[]) => void) => {
		if (conversation) {
			const updatedMessages = await ConversationManager.addMessageToConversation(plugin, conversation.id, newMessage);
			callback(updatedMessages);
		} else {
			console.error('Chat session is not initialized.');
			return;
		}
	};

	const onPinInputBox = (event: React.FormEvent) => {
		event.preventDefault();
		setIsPinned(!isPinned);
	}

	const handleInputText = (event: any) => {
		if (inputText.length <= 2000) {
			setInputText(event.target.value);
		}
	}

	const handleKeyDown = (event: any) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onSubmit(event);
		}
	};

	const handlePaste = (event: any) => {
		const pastedText = event.clipboardData.getData('text');
		if (inputText.length + pastedText.length > 2000) {
			event.preventDefault();
			return;
		}
	}

	const getRenderedMessages = (conversation: IConversation | null | undefined): IChatMessage[] => {
		if (!conversation) {
			return [];
		}

		// Initialize selected children object.
		const selectedChildren: { [key: string]: number } = {};

		// Function to find path to current node and populate selectedChildren.
		const findPathToCurrentNode = (messageId: string, path: string[]): string[] => {
			const message = conversation.messages.find(msg => msg.id === messageId);

			if (message) {
				if (message.children && message.children.length > 0) {
					for (let i = 0; i < message.children.length; i++) {
						const childId = message.children[i];
						if (childId === conversation.currentNode || findPathToCurrentNode(childId, [...path, messageId]).length > 0) {
							selectedChildren[messageId] = i;
							return [...path, messageId];
						}
					}
				}
			}

			return [];
		}

		// Start finding path from the root message.
		findPathToCurrentNode(conversation.messages.find(msg => msg.author.role === "system")?.id || '', []);

		// Function to get messages to be rendered.
		const deriveRenderedMessages = (messageId: string): IChatMessage[] => {
			const message: IChatMessage | undefined | null = conversation.messages.find((msg) => msg.id === messageId);

			if (!message) {
				return [];
			}

			const childIds = message.children || [];
			const selectedChildIndex = selectedChildren[messageId] || 0;

			return [
				message,
				...(childIds[selectedChildIndex] ? deriveRenderedMessages(childIds[selectedChildIndex]) : [])
			];
		};

		const rootMessage = conversation.messages.find((msg) => msg.author.role === "system");

		return rootMessage ? deriveRenderedMessages(rootMessage.id) : [];
	};

	const onSubmit = async (event: React.FormEvent, overrideText?: string) => {
		event.preventDefault();

		let textToUse = overrideText ? overrideText : inputText;

		if (textToUse.trim() === '') {
			return;
		}

		// Create a new OpenAIMessageDispatcher when the form is submitted
		messageDispatcherRef.current = new OpenAIMessageDispatcher(
			plugin,
			conversation as IConversation,
			setConversationSession,
			updateConversation
		);

		messageDispatcherRef.current.handleSubmit(
			getRenderedMessages,
			textToUse,
			setIsLoading
		);

		setInputText('');
	}

	const onCancelRequest = useCallback(async () => {
		if (messageDispatcherRef.current) {
			await messageDispatcherRef.current.handleStopStreaming();
		}

		setIsLoading(false);
	}, []);

	const handleRegenerateMessage = async () => {
		messageDispatcherRef.current = new OpenAIMessageDispatcher(
			plugin,
			conversation as IConversation,
			setConversationSession,
			updateConversation
		);

		messageDispatcherRef.current.handleRegenerateAssistantResponse(
			getRenderedMessages,
			setIsLoading
		);
	}

	const handleCreateNewConversation = async () => {
		const newConversation = await ConversationManager.createNewConversation(plugin);
		onConversationLoad(newConversation);
		setConversationSession(newConversation);
	}

	const lastAssistantMessage = conversation?.messages.slice().reverse().find(message => message.author.role === 'assistant');

	return (
		<div className="ow-conversation-input-area">
			<ConversationSuggestedQuestions plugin={plugin} conversation={conversation} onSubmit={onSubmit} />
			{
				selectedText !== "" ? (
					<ConversationSelectedText
						plugin={plugin}
						selectedText={selectedText}
						setSelectedText={setSelectedText}
						conversation={conversation}
						setConversationSession={setConversationSession}
						updateConversation={updateConversation}
						getRenderedMessages={getRenderedMessages}
					/>
				) : (
					conversation!?.messages.length >= 2 ? (
						lastAssistantMessage && lastAssistantMessage.content.content_type === 'question' ? (
							null
						) : (
							<div className="ow-input-tool-bar">
								{isLoading === true ? (
									<button
										onClick={onCancelRequest}
										className="ow-btn-stop-request"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
										<span>STOP</span>
									</button>
								) : (
									<button
										onClick={handleRegenerateMessage}
										className="ow-btn-stop-request"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
										<span>REGENERATE</span>
									</button>
								)}
							</div>
						)
					) : null
				)
			}
			<form
				className="ow-conversation-input-form"
				onSubmit={onSubmit}
			>
				{showButton && (
					<button
						className="ow-btn-new-conversation"
						type="button"
						onClick={() => {
							setIsPinned(false);
							handleCreateNewConversation()
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
					</button>
				)}
				<div
					className={`ow-text-box ${isPinned ? 'pinned' : ''}`}
					onMouseEnter={() => setShowButton(false)}
					onMouseLeave={() => setShowButton(true)}
				>
					<div className="input">
						<textarea
							placeholder="Ask me anything..."
							value={inputText}
							onKeyDown={handleKeyDown}
							onChange={(event) => { handleInputText(event) }}
							onPaste={(event) => { handlePaste(event) }}
							disabled={isLoading}
						/>
						{inputText.length === 0 ? (
							<>
							</>
						) : (
							<button className="ow-btn-submit" type="submit">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
							</button>
						)}
					</div>
					<div className="ow-info-bar">
						<span>{inputText.length}/2000</span>
						<span></span>
						<button
							className={`ow-pin-text-box ${isPinned ? 'pinned' : ''}`}
							onClick={onPinInputBox}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
