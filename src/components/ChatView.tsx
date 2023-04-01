import { FileSystemAdapter, normalizePath } from 'obsidian';
import React, { useState, useEffect } from 'react';

import Weaver from 'main';

import OpenAIContentProvider from '../helpers/OpenAIContentProvider';

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

export const MessageBubble: React.FC<{ role: string; content: string; timestamp: string }> = ({ role, content, timestamp }) => {
	return (
		<div className={role === 'user' ? 'user-message' : 'assistant-message'}>
			<div>{content}</div>
			<div className="timestamp">{timestamp}</div>
		</div>
	);
};

export const ChatView: React.FC<{ 
	plugin: Weaver, 
	selectedConversationId: number | null, 
	lastActiveConversationId: number | null,
	setLastActiveConversationId: (id: number) => void;
}> = ({ plugin, selectedConversationId, lastActiveConversationId, setLastActiveConversationId}) => {
	const [inputText, setInputText] = useState<string>('');
	const [conversation, setConversation] = useState<IConversation | undefined>(undefined)
	
	const openAIContentProvider = new OpenAIContentProvider(plugin.app, plugin);

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
	}, [selectedConversationId, lastActiveConversationId]);	

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
		console.log(updatedMessages);

		// Generate the assistant's response message
		const assistantGeneratedResponse = await openAIContentProvider.generate(updatedMessages) || 'Unable to generate a response';
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
		setConversation(undefined);
		startNewConversation();
	};

	return (
		<div className="chat-view">
			<div className="chat-history">
				{
					conversation?.messages.map((message, index) => (
						<MessageBubble key={index} role={message.role} content={message.content} timestamp={message.timestamp} />
					))
				}
			</div>
			<div>
				<form onSubmit={handleSubmit}>
					<button type="button" onClick={handleClear}>
						CLEAR
					</button>
					<input
						type="text"
						value={inputText}
						onChange={(event) => setInputText(event.target.value)}
					/>
					<button type="submit">
						SEND						
					</button>
				</form>
			</div>
		</div>
	);
}
