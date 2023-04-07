import Weaver from 'main'
import React, { useEffect, useState } from 'react';

import { HomePage } from './HomePage';
import { ChatView } from './ChatView';
import { ChatDialogueWindow } from './ChatDialogueWindow';

export interface TabsManagerProps {
	plugin: Weaver
}

export const TabsManager: React.FC<TabsManagerProps> = ({ plugin }) => {
	const [activeTab, setActiveTab] = useState("home-page");
	const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
	const [lastActiveConversationId, setLastActiveConversationId] = useState<number | null>(null);

	const handleTabSwitch = (tabId: string) => {
		setActiveTab(tabId);
	}

	const handleConversationSelect = (conversationId: number) => {
		setSelectedConversationId(conversationId);
	};

	const handleNewConversation = () => {
		setLastActiveConversationId(null);
		setSelectedConversationId(null);
	};

	return (
		<div className="tabs-manager">
			{activeTab === "home-page" ? (
				<HomePage plugin={plugin} onNewConversation={handleNewConversation} onTabSwitch={handleTabSwitch} onConversationLoad={handleConversationSelect}/>
			) : (
				<ChatDialogueWindow
					plugin={plugin}
					onTabSwitch={handleTabSwitch}
					selectedConversationId={selectedConversationId}
					lastActiveConversationId={lastActiveConversationId}
					setLastActiveConversationId={setLastActiveConversationId}
				/>
			)}
		</div>
	)
}
