import { FileSystemAdapter, normalizePath } from 'obsidian';
import React, { useState, useEffect, useRef } from 'react';

import Weaver from 'main';

import OpenAIContentProvider from '../helpers/OpenAIContentProvider';
import { MessageBubble } from './MessageBouble';

import { ConversationHelper } from '../helpers/ConversationHelpers';

export interface IMessage {
	role: string;
	timestamp: string;
	content: string;
}

export interface IConversation {
	id: number;
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

	const openAIContentProvider = new OpenAIContentProvider(plugin);

	const [isExpanded, setIsExpanded] = useState(false);

	const conversationHistoryRef = useRef<HTMLDivElement>(null);

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
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;
		const normalizedPath = normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/conversations.json");

		const newConversation: IConversation = {
			id: Date.now(),
			title: `Untitled ${Date.now()}`,
			timestamp: new Date().toISOString(),
			messages: [
				{
					role: 'assistant',
					timestamp: new Date().toLocaleTimeString(),
					content: 'Welcome back! What would you like to chat about?',
				}
			]
		};

		setConversation(newConversation);
		setLastActiveConversationId(newConversation.id);

		if (!(await adapter.exists(normalizedPath))) {
			await adapter.write(normalizedPath, JSON.stringify([newConversation], null, 4));
		} else {
			const data = await adapter.read(normalizedPath);

			const existingConversations = data ? JSON.parse(data) : [];
			const mergedConversations = [...existingConversations, newConversation];

			const uniqueConversations = mergedConversations.filter((conversation, index, array) => {
				return index === array.findIndex((c) => c.id === conversation.id);
			});

			await adapter.write(normalizedPath, JSON.stringify(uniqueConversations, null, 4));
		}
	};

	const loadConversationById = async (conversationId: number) => {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;
		const normalizedPath = normalizePath(plugin.app.vault.configDir + "/plugins/obsidian-weaver/conversations.json");

		const data = await adapter.read(normalizedPath);
		const existingConversations = data ? JSON.parse(data) : [];

		const selectedConversation = existingConversations.find((c: IConversation) => c.id === conversationId);

		if (selectedConversation) {
			setConversation(selectedConversation);
		} else {
			console.error('Conversation not found in the existing conversations array.');
		}
	};

	const updateConversation = async (newMessage: IMessage, callback: (updatedMessages: IMessage[]) => void) => {
		if (conversation) {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const normalizedPath = normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/conversations.json");

			const data = await adapter.read(normalizedPath);
			const existingConversations = data ? JSON.parse(data) : [];

			const conversationIndex = existingConversations.findIndex((c: IConversation) => c.id === conversation.id);

			if (conversationIndex !== -1) {
				existingConversations[conversationIndex].messages.push(newMessage);

				await adapter.write(
					normalizePath(normalizedPath),
					JSON.stringify(existingConversations, null, 4)
				);

				// Call the callback function to update the state
				callback(existingConversations[conversationIndex].messages);
			} else {
				console.error('Conversation not found in the existing conversations array.');
			}
		}
	};

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

		// Generate the assistant's response message
		const assistantGeneratedResponse = await openAIContentProvider.generateResponse(plugin.settings, {}, updatedMessages) || 'Unable to generate a response';
		const assistantMessage = { role: 'assistant', content: assistantGeneratedResponse, timestamp };

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
	};

	const handleClear = () => {
		if (conversation?.messages.length as number > 1) {
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
						{conversation?.title}
					</div>
				</div>
			</div>
			<div ref={conversationHistoryRef} className="conversation-history">
				{
					conversation?.messages.map((message, index) => (
						<MessageBubble key={index} role={message.role} content={message.content} timestamp={message.timestamp} />
					))
				}
			</div>
			<div className="input-area">
				<form className="input-form" onSubmit={handleSubmit}>
					<button className="btn-clean" type="button" onClick={handleClear}>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
					</button>
					<div className="chat-box">
						<div className="input">
							<textarea
								placeholder="Ask me anything..."
								value={inputText}
								onKeyDown={handleKeyDown}
								onChange={(event) => { handleInputText(event) }}
							/>
							<button className="btn-submit" type="submit">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
							</button>
						</div>
						<div className="info-bar">
							<span>{inputText.length}/2000</span>
							<button className="pin-chat-box">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
