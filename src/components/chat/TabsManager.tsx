// Obsidian
import Weaver from 'main'

// Third-party modules
import React, { useEffect, useState } from 'react';

// Components
import { HomePage } from '../HomePage';
import { ConversationDialogue } from './ConversationDialogue';

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
				<ConversationDialogue
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
