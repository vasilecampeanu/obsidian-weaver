import React, { useState, useEffect } from 'react';
import { FileSystemAdapter, normalizePath } from 'obsidian';

import Weaver from '../main'

interface IMessage {
	role: string;
	content: string;
	timestamp: string;
}

interface IConversation {
	id: number | null;
	timestamp: string | null;
	messages: IMessage[];
}

const MessageBubble: React.FC<{ role: string; content: string; timestamp: string }> = ({ role, content, timestamp }) => {
	return (
		<div className={role === 'user' ? 'user-message' : 'ai-message'}>
			<div>{content}</div>
			<div className="timestamp">{timestamp}</div>
		</div>
	);
};

const saveConversations = async (conversations: IConversation[], plugin: Weaver) => {
	const adapter = plugin.app.vault.adapter as FileSystemAdapter;
	const normalizedPath = normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/conversations.json");
	await adapter.write(normalizedPath, JSON.stringify(conversations, null, 4));
}

const loadConversations = async (plugin: Weaver) => {
	const adapter = plugin.app.vault.adapter as FileSystemAdapter;
	const normalizedPath = normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/conversations.json");

	if (await adapter.exists(normalizedPath)) {
		const fileContent = await adapter.read(normalizedPath);
		return JSON.parse(fileContent);
	} else {
		return [];
	}
}

export const ChatView: React.FC<{ plugin: Weaver }> = ({ plugin }) => {
	const [inputText, setInputText] = useState<string>('');
	const [conversation, setConversation] = useState<IConversation>({
		id: null,
		timestamp: null,
		messages: [] as IMessage[]
	});

	useEffect(() => {
		startNewConversation();
	}, [])

	const startNewConversation = async () => {
		const newConversation = {
			id: Date.now(),
			timestamp: new Date().toISOString(),
			messages: [
				...conversation.messages,
				{
					role: 'assistant',
					content: 'Welcome back! What would you like to chat about?',
					timestamp: new Date().toLocaleTimeString(),
				},
			],
		}

		const updatedConversations = await loadConversations(plugin);
		updatedConversations.push(newConversation);
		await saveConversations(updatedConversations, plugin);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (inputText.trim() === '') {
			return;
		}

		const timestamp = new Date().toLocaleTimeString();
		const userMessage = { role: 'user', content: inputText, timestamp };

		setInputText('');

		setConversation((prevConversation) => ({
			id: Date.now(),
			timestamp: new Date().toISOString(),
			messages: [...prevConversation.messages, userMessage],
		}));

		const assistantMessage = { role: 'assistant', content: 'Hello world!', timestamp };

		setConversation((prevConversation) => ({
			id: Date.now(),
			timestamp: new Date().toISOString(),
			messages: [...prevConversation.messages, assistantMessage],
		}));

		const updatedConversations = await loadConversations(plugin);
		const conversationIndex = updatedConversations.findIndex((c: { id: number | null; }) => c.id === conversation.id);
		if (conversationIndex !== -1) {
			updatedConversations[conversationIndex] = { ...conversation, messages: [...conversation.messages, userMessage, assistantMessage] };
			setConversation(updatedConversations[conversationIndex]);
		}

		await saveConversations(updatedConversations, plugin);
	}

	return (
		<div>
			<div className="chat-history">
				{conversation.messages.map((message, index) => (
					<MessageBubble key={index} role={message.role} content={message.content} timestamp={message.timestamp} />
				))}
			</div>
			<div>
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={inputText}
						onChange={(event) => setInputText(event.target.value)}
					/>
					<button type="submit">SEND</button>
				</form>
			</div>
		</div>
	);
}
