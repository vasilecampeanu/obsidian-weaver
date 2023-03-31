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

export const ChatView: React.FC<{plugin: Weaver}> = ({plugin}) => {
    const [inputText, setInputText] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<{ role: string; content: string; timestamp: string }[]>([]);

    useEffect(() => {
        loadConversationHistory();
    }, []);

	const loadConversationHistory = async () => {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const data = await adapter.read(
				normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/chat-history.json")
			);
			const parsedData = data ? JSON.parse(data) : [];
			setChatHistory(parsedData);
		} catch (error) {
			console.error('Failed to load conversation history:', error);
		}
	};	

    const saveConversationHistory = async () => {
        try {
            const adapter = plugin.app.vault.adapter as FileSystemAdapter;
            await adapter.write(
				normalizePath(app.vault.configDir + "/plugins/obsidian-weaver/chat-history.json"), 
				JSON.stringify(chatHistory)
			);
        } catch (error) {
            console.error('Failed to save conversation history:', error);
        }
    };

    const clearConversation = () => {
        setChatHistory([]);
        setInputText('');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (inputText.trim() === '') {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const userMessage = { role: 'user', content: inputText, timestamp };

        setChatHistory([...chatHistory, userMessage]);
        setInputText('');

        const response = await callOpenAIAPI([{ role: "user", content: inputText }]);

        const aiMessage = { role: 'ai', content: response, timestamp };
        setChatHistory([...chatHistory, userMessage, aiMessage]);

        saveConversationHistory();
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
