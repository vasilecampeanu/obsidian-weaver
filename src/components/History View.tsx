import React, { useState, useEffect } from 'react';
import { FileSystemAdapter, normalizePath } from 'obsidian';
import { IConversation } from './ChatView'; // import IConversation from ChatView

import Weaver from 'main';

export interface HistoryViewProps {
	plugin: Weaver,
	onConversationSelect: (conversationId: number) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
	plugin,
	onConversationSelect
}) => {
	const [conversations, setConversations] = useState<IConversation[]>([]);

	useEffect(() => {
		fetchConversations();
	}, []);

	const fetchConversations = async () => {
		const adapter = plugin.app.vault.adapter as FileSystemAdapter;
		const normalizedPath = normalizePath(plugin.app.vault.configDir + "/plugins/obsidian-weaver/conversations.json");
		const data = await adapter.read(normalizedPath);
		const existingConversations = data ? JSON.parse(data) : [];
		
		setConversations(existingConversations);
	};

	const handleConversationSelect = (conversationId: number) => {
		onConversationSelect(conversationId);
	};

	return (
		<div>
			<h2>History</h2>
			<ul>
				{conversations.map((conversation, index) => (
					<li
						key={index}
						onClick={() => {
							handleConversationSelect(conversation.id);
						}}
						style={{ cursor: 'pointer' }}
					>
						{conversation.title}
					</li>
				))}
			</ul>
		</div>
	);
};
