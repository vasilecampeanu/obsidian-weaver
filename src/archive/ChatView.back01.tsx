import React, { useState, useRef, useEffect, useContext } from 'react';
import { callOpenAIAPI } from '../helpers/OpenAI';
import { FileSystemAdapter, normalizePath } from 'obsidian';

import Weaver from '../main'

const MessageBubble: React.FC<{ role: string; content: string; timestamp: string }> = ({ role, content, timestamp }) => {
	return (
		<div className={role === 'user' ? 'user-message' : 'ai-message'}>
			<div>{content}</div>
			<div className="timestamp">{timestamp}</div>
		</div>
	);
};

export const ChatView: React.FC<{ plugin: Weaver }> = ({ plugin }) => {
	const [inputText, setInputText] = useState<string>('');
	const [chatHistory, setChatHistory] = useState<{ role: string; content: string; timestamp: string }[]>([]);
	const [conversations, setConversations] = useState<any[]>([]);
	const [currentConversationID, setCurrentConversationID] = useState<number | null>(null);

	useEffect(() => {
		if (conversations.length > 0) {
			saveConversations();
		}
	}, [conversations]);

	const saveConversations = async () => {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			
			const data = await adapter.read(
				normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/conversations.json")
			);
	
			const existingConversations = data ? JSON.parse(data) : [];
			const mergedConversations = [...existingConversations, ...conversations];
	
			const uniqueConversations = mergedConversations.filter((conversation, index, array) => {
				return index === array.findIndex((c) => c.id === conversation.id);
			});
	
			await adapter.write(
				normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/conversations.json"),
				JSON.stringify(uniqueConversations, null, 4)
			);
		} catch (error) {
			console.error('Failed to save conversations:', error);
		}
	};

	const startNewConversation = () => {
		const newConversation = {
			id: Date.now(),
			timestamp: new Date().toISOString(),
			messages: []
		};

		setConversations([...conversations, newConversation]);
		setCurrentConversationID(newConversation.id);
		setChatHistory([]);
	};

	const clearConversation = () => {
		startNewConversation();
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
	
		if (inputText.trim() === '') {
			return;
		}
	
		if (currentConversationID === null) {
			startNewConversation();
		}
	
		const timestamp = new Date().toLocaleTimeString();
		const userMessage = { role: 'user', content: inputText, timestamp };
	
		// Update the chat history state
		setChatHistory((prevChatHistory) => [...prevChatHistory, userMessage]);
		setInputText('');
	
		const response = await callOpenAIAPI([{ role: "user", content: inputText }]);
	
		const aiMessage = { role: 'ai', content: response, timestamp };
	
		// Update the chat history state again with AI message
		setChatHistory((prevChatHistory) => [...prevChatHistory, aiMessage]);
	
		// Update the current conversation in the conversations list
		setConversations((prevConversations) => prevConversations.map(conversation => {
			if (conversation.id === currentConversationID) {
				return {
					...conversation,
					messages: [...chatHistory, userMessage, aiMessage]
				};
			}

			return conversation;
		}));
	};	

	return (
		<div>
			<div>
				{chatHistory.map((message, index) => (
					<MessageBubble key={index} role={message.role} content={message.content} timestamp={message.timestamp} />
				))}
			</div>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					value={inputText}
					onChange={(event) => setInputText(event.target.value)}
				/>
				<button type="submit">Send</button>
			</form>
			<button onClick={clearConversation}>Clear Conversation</button>
		</div>
	);
};
