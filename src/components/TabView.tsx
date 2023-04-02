import React, { useEffect, useState } from 'react';
import { ChatView, IConversation } from './ChatView';
import { HistoryView } from './HistoryView';

import Weaver from 'main'

export interface TabViewProps {
	plugin: Weaver
}

export const TabView: React.FC<TabViewProps> = ({ plugin }) => {
	const [activeTab, setActiveTab] = useState('chat');
	const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
	const [lastActiveConversationId, setLastActiveConversationId] = useState<number | null>(null);

	const handleConversationSelect = (conversationId: number) => {
		setSelectedConversationId(conversationId);
		setActiveTab('chat'); // Switch to the chat view tab when a conversation is selected
	};

	return (
		<div>
			<ul className="tab-header">
				<li className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
					Chat
				</li>
				<li className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
					History
				</li>
			</ul>
			<div className="tab-content">
				{activeTab === 'chat' ? (
					<ChatView
						plugin={plugin}
						selectedConversationId={selectedConversationId}
						lastActiveConversationId={lastActiveConversationId}
						setLastActiveConversationId={setLastActiveConversationId}
					/>
				) : (
					<HistoryView plugin={plugin} onConversationSelect={handleConversationSelect} />
				)}
			</div>
		</div>
	);
};
