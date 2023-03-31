import { FileSystemAdapter, normalizePath } from 'obsidian';
import React, { useState, useEffect } from 'react';

import Weaver from 'main';

interface IMessage {
	role: string;
	timestamp: string;
	content: string;
}

interface IConversation {
	id: number;
	title: string;
	timestamp: string;
	messages: IMessage[];
}

const MessageBubble: React.FC<{ role: string; content: string; timestamp: string }> = ({ role, content, timestamp }) => {
	return (
		<div className={role === 'user' ? 'user-message' : 'assistant-message'}>
			<div>{content}</div>
			<div className="timestamp">{timestamp}</div>
		</div>
	);
};

export const ChatView: React.FC<{ plugin: Weaver }> = ({ plugin }) => {
	const [inputText, setInputText] = useState<string>('');
	const [conversation, setConversation] = useState<IConversation | undefined>(undefined)

	useEffect(() => {
		startNewConversation();
	}, []);
	
	const startNewConversation = async () => {
		if (conversation === undefined) {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const normalizedPath = normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/conversations.json");
	
			const conversation: IConversation = {
				id: Date.now(),
				title: `Untitled`,
				timestamp: new Date().toISOString(),
				messages: [
					{
						role: 'assistant',
						timestamp: new Date().toLocaleTimeString(),
						content: 'Welcome back! What would you like to chat about?',
					}
				]
			};
	
			setConversation(conversation);
	
			if (!(await adapter.exists(normalizedPath))) {
				await adapter.write(normalizedPath, "[]");
			} else {
				const data = await adapter.read(normalizedPath);
	
				const existingConversations = data ? JSON.parse(data) : [];
				const mergedConversations = [...existingConversations, conversation];
	
				const uniqueConversations = mergedConversations.filter((conversation, index, array) => {
					return index === array.findIndex((c) => c.id === conversation.id);
				});
	
				await adapter.write(normalizedPath, JSON.stringify(uniqueConversations, null, 4));
			}
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
	
		// Generate the assistant's response message
		const assistantMessage = { role: 'assistant', content: 'Hello world!', timestamp };
	
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
					<input
						type="text"
						value={inputText}
						onChange={(event) => setInputText(event.target.value)}
					/>
					<button type="submit">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
					</button>
				</form>
			</div>
		</div>
	);
}
