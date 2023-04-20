// Obsidian
import Weaver from 'main'

// Third-party modules
import React, { useEffect, useState } from 'react';

// Components
import { ThreadChain } from './ThreadChain/ThreadChain';
import { ConversationDialogue } from './Chat/ConversationDialogue';
import { eventEmitter } from 'utils/EventEmitter';

export interface TabsManagerProps {
	plugin: Weaver
}

export const TabsManager: React.FC<TabsManagerProps> = ({ plugin }) => {
	const [activeTab, setActiveTab] = useState("home-page");
	const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
	const [lastActiveConversationId, setLastActiveConversationId] = useState<number | null>(null);
	const [reloadTrigger, setReloadTrigger] = React.useState<number>(0);

	useEffect(() => {
		const handleReload = async () => {
			setActiveTab("home-page");
			setReloadTrigger((prevTrigger) => prevTrigger + 1);
		};

		eventEmitter.on('reloadEvent', handleReload);

		return () => {
			eventEmitter.off('reloadEvent', handleReload);
		};
	}, []);

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
		<div className="tabs-manager" key={reloadTrigger}>
			{activeTab === "home-page" ? (
				<ThreadChain 
					plugin={plugin} 
					onNewConversation={handleNewConversation} 
					onTabSwitch={handleTabSwitch} 
					onConversationLoad={handleConversationSelect}
				/>
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
