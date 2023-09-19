import Weaver from "main";
import React, { useCallback, useState } from "react";

import { Thread } from "./Thread";
import { Chat } from "./chat/Chat";

import { TabId } from "types/GeneralTypes";
import { ConversationManager } from "utils/ConversationManager";

interface TabsManagerProps {
	plugin: Weaver
}

export const TabsManager: React.FC<TabsManagerProps> = ({ plugin }) => {
	const [activeTab, setActiveTab] = useState<TabId>('THREAD');
	const conversationManager = new ConversationManager(plugin);

    const handleTabSwitcher = useCallback((tabId: TabId) => {
        setActiveTab(tabId);
    }, []);

	return(
		<div className="ow-tabs-manager">
			{activeTab === 'THREAD' ? (
				<Thread 
					plugin={plugin} 
					conversationManager={conversationManager}
					handleTabSwitcher={handleTabSwitcher}
				/>
			) : (
				<Chat 
					plugin={plugin} 
					conversationManager={conversationManager}
					handleTabSwitcher={handleTabSwitcher} 
				/>
			)}
		</div>
	)
}
