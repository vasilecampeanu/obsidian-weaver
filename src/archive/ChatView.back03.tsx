import React, { useState, useEffect } from 'react';
import { FileSystemAdapter, normalizePath } from 'obsidian';
import Weaver from 'main';

interface IMessage {
    role: string;
    content: string;
    timestamp: string;
}

interface IConversation {
    id: number;
    timestamp: string;
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
interface ChatViewProps {
    plugin: Weaver;
}

export const ChatView: React.FC<ChatViewProps> = ({ plugin }) => {
    const [inputText, setInputText] = useState<string>('');
    const [conversation, setConversation] = useState<IConversation>({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        messages: [],
    });

    useEffect(() => {
        startNewConversation();
    }, []);

    const startNewConversation = async () => {
        const newConversation: IConversation = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            messages: [
                {
                    role: 'assistant',
                    content: 'Welcome back! What would you like to chat about?',
                    timestamp: new Date().toLocaleTimeString(),
                },
            ],
        };

        setConversation(newConversation);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (inputText.trim() === '') {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const userMessage: IMessage = { role: 'user', content: inputText, timestamp };

        setInputText('');

        setConversation((prevConversation) => ({
            ...prevConversation,
            messages: [...prevConversation.messages, userMessage],
        }));

        const assistantMessage: IMessage = { role: 'assistant', content: 'Hello world!', timestamp };

        setConversation((prevConversation) => ({
            ...prevConversation,
            messages: [...prevConversation.messages, assistantMessage],
        }));
    };

    const handleSave = async () => {
        const conversations = await loadConversations(plugin);
        conversations.push(conversation);
        await saveConversations(conversations, plugin);
    };

    const handleClear = () => {
        startNewConversation();
    };

    return (
		<>
		</>
	)
}
