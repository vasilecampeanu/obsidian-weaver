import { FileSystemAdapter, normalizePath } from 'obsidian';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import Weaver from 'main';

import OpenAIContentProvider from '../helpers/OpenAIContentProvider';
import { ConversationHelper } from '../helpers/ConversationHelpers';
import { MessageBubble } from './MessageBouble';


export interface IMessage {
	role: string;
	timestamp: string;
	content: string;
	isLoading?: boolean;
}

export interface IConversation {
	conversationId: number;
	title: string;
	timestamp: string;
	messages: IMessage[];
}

export interface ChatViewProps {
	plugin: Weaver,
	selectedConversationId: number | null,
	lastActiveConversationId: number | null,
	setLastActiveConversationId: (id: number) => void,
	onTabSwitch: (tabId: string) => void
}

export const ChatView: React.FC<ChatViewProps> = ({
	plugin,
	selectedConversationId,
	lastActiveConversationId,
	setLastActiveConversationId,
	onTabSwitch
}) => {
	const [inputText, setInputText] = useState<string>('');
	const [conversation, setConversation] = useState<IConversation | undefined>(undefined)

	const [isTitleEditing, setIsTitleEditing] = useState<boolean>(false);
	const [titleInput, setTitleInput] = useState<string>('');

	const openAIContentProviderRef = useRef(new OpenAIContentProvider(plugin));

	const handleStopButtonClick = useCallback(() => {
		openAIContentProviderRef.current.cancelRequest();
	}, []);

	const conversationHistoryRef = useRef<HTMLDivElement>(null);

	const [isPinned, setIsPinned] = useState<Boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const activeProfileId = 1;

	useEffect(() => {
		if (conversation === undefined) {
			if (selectedConversationId !== null) {
				loadConversationById(selectedConversationId);
			} else if (lastActiveConversationId !== null) {
				loadConversationById(lastActiveConversationId);
			} else {
				startNewConversation();
			}
		}
	}, [selectedConversationId, lastActiveConversationId, conversation]);

	useEffect(() => {
		if (conversationHistoryRef.current) {
			conversationHistoryRef.current.scrollTop = conversationHistoryRef.current.scrollHeight;
		}
	}, [conversation?.messages.length]);

	const startNewConversation = async () => {
		const newConversation: IConversation = {
			id: Date.now(),
			title: `Untitled`,
			timestamp: new Date().toISOString(),
			messages: []
		};

		setConversation(newConversation);
		setLastActiveConversationId(newConversation.id);

		try {
			const existingConversations = await ConversationHelper.readConversations(plugin, activeProfileId);
			const mergedConversations = [...existingConversations, newConversation];
			const uniqueConversations = mergedConversations.filter((conversation, index, array) => {
				return index === array.findIndex((c) => c.id === conversation.id);
			});
			ConversationHelper.writeConversations(plugin, activeProfileId, uniqueConversations);
		} catch (error) {
			console.error('Error in conversation handling:', error);
		}
	};

	const loadConversationById = async (conversationId: number) => {
		const data = await ConversationHelper.readConversations(plugin, activeProfileId);

		const selectedConversation = data.find((c: IConversation) => c.id === conversationId);

		if (selectedConversation) {
			setConversation(selectedConversation);
		} else {
			console.error('Conversation not found in the existing conversations array.');
		}
	};

	const updateConversation = async (newMessage: IMessage, callback: (updatedMessages: IMessage[]) => void) => {
		if (conversation) {
			const data = await ConversationHelper.readConversations(plugin, activeProfileId);
			const conversationIndex = data.findIndex((c: IConversation) => c.id === conversation.id);

			if (conversationIndex !== -1) {
				data[conversationIndex].messages.push(newMessage);
				ConversationHelper.writeConversations(plugin, activeProfileId, data);
				callback(data[conversationIndex].messages); // Call the callback function to update the state
			} else {
				console.error('Conversation not found in the existing conversations array.');
			}
		}
	};

	const updateConversationTitle = async (newTitle: string) => {
		if (conversation) {
			const data = await ConversationHelper.readConversations(plugin, activeProfileId);
			const conversationIndex = data.findIndex((c: IConversation) => c.id === conversation.id);

			if (conversationIndex !== -1) {
				data[conversationIndex].title = newTitle;

				ConversationHelper.writeConversations(plugin, activeProfileId, data);

				setConversation((prevState) => {
					if (prevState) {
						return {
							...prevState,
							title: newTitle
						};
					} else {
						return prevState;
					}
				});
			} else {
				console.error('Conversation not found in the existing conversations array.');
			}
		}
	};


	useEffect(() => {
		console.log(conversation);
	}, [conversation]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (inputText.trim() === '') {
			return;
		}

		const timestamp: string = new Date().toLocaleTimeString();
		const userMessage: IMessage = { role: 'user', content: inputText, timestamp };

		// Update the conversation with the user's message
		await updateConversation(userMessage, (updatedMessages) => {
			setInputText('');
			setConversation((prevState) => {
				if (prevState) {
					return {
						...prevState,
						messages: updatedMessages
					};
				} else {
					return prevState;
				}
			});
		});

		// Create a new array of messages including the user's inputText
		const updatedMessages = [...(conversation?.messages || []), userMessage];

		const loadingAssistantMessage: IMessage = {
			role: 'assistant',
			content: '',
			timestamp: '',
			isLoading: true
		};

		setIsLoading(true);

		setConversation((prevConversation) => {
			if (prevConversation) {
				return {
					...prevConversation,
					messages: [...prevConversation.messages, loadingAssistantMessage],
				};
			} else {
				return prevConversation;
			}
		});

		// Generate the assistant's response message
		const assistantGeneratedResponse = await openAIContentProviderRef.current.generateResponse(plugin.settings, {}, updatedMessages);
		let assistantResponseContent = 'Unable to generate a response';

		if (assistantGeneratedResponse) {
			assistantResponseContent = assistantGeneratedResponse;
		}

		const assistantMessage = { role: 'assistant', content: assistantResponseContent, timestamp };

		// Update the conversation with the assistant's message
		await updateConversation(assistantMessage, (updatedMessages) => {
			setConversation((prevState) => {
				if (prevState) {
					return {
						...prevState,
						messages: updatedMessages
					};
				} else {
					return prevState;
				}
			});
		});

		setIsLoading(false);
	};

	const handleClear = () => {
		if (conversation?.messages.length as number > 1) {
			console.log("Hello world!")
			setConversation(undefined);
			startNewConversation();
		}
	};

	const handleBackToHomePage = () => {
		onTabSwitch("home-page");
	}

	const handleKeyDown = (event: any) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault(); // Prevents the default action (newline) when Enter is pressed
			handleSubmit(event);
		}
	};

	const handleInputText = (event: any) => {
		if (inputText.length <= 2000) {
			setInputText(event.target.value);
		}
	}

	const ahndlePinInputBox = () => {
		setIsPinned(!isPinned);
	}

	return (
		<div className="chat-view">
			<div className="header">
				<div className="tool-bar">
					<button
						className="btn-back"
						onClick={() => {
							handleBackToHomePage();
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
					</button>
					<div className="title">
						{isTitleEditing ? (
							<input
								autoFocus
								type="text"
								value={titleInput}
								onBlur={() => {
									setIsTitleEditing(false);
									updateConversationTitle(titleInput);
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										setIsTitleEditing(false);
										updateConversationTitle(titleInput);
									}
								}}
								onChange={(e) => setTitleInput(e.target.value)}
							/>
						) : (
							<span onDoubleClick={() => {
								setIsTitleEditing(true);
								setTitleInput(conversation?.title || '');
							}}>
								{conversation?.title}
							</span>
						)}
					</div>
				</div>
			</div>
			<div ref={conversationHistoryRef} className="conversation-history">
				{
					conversation?.messages.map((message, index) => (
						<MessageBubble key={index} role={message.role} content={message.content} timestamp={message.timestamp} isLoading={message.isLoading} />
					))
				}
			</div>
			<div className="input-area">
				<button
					onClick={handleStopButtonClick}
				>
					STOP
				</button>
				<form className="input-form" onSubmit={handleSubmit}>
					<button className="btn-clean" type="button" onClick={handleClear}>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
					</button>
					<div
						className={`chat-box ${isPinned ? 'pinned' : ''}`}
					>
						<div className="input">
							<textarea
								placeholder="Ask me anything..."
								value={inputText}
								onKeyDown={handleKeyDown}
								onChange={(event) => { handleInputText(event) }}
								disabled={isLoading}
							/>
							{inputText.length === 0 ? (
								<>
								</>
							) : (
								<button className="btn-submit" type="submit">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
								</button>
							)}
						</div>
						<div className="info-bar">
							<span>{inputText.length}/2000</span>
							<button
								className={`pin-chat-box ${isPinned ? 'pinned' : ''}`}
								onClick={ahndlePinInputBox}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
