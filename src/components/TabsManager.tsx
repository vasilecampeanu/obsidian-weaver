import Weaver from "main";
import React, { useCallback, useState } from "react";

import { Thread } from "./Thread";
import { Chat } from "./chat/Chat";

import { TabId } from "types/GeneralTypes";
import { ChatProvider } from "./chat/ChatContext";

interface TabsManagerProps {
	plugin: Weaver
}

export const TabsManager: React.FC<TabsManagerProps> = ({ plugin }) => {
	const [activeTab, setActiveTab] = useState<TabId>('THREAD');

	const handleTabSwitcher = useCallback((tabId: TabId) => {
		setActiveTab(tabId);
	}, []);

	return (
		<ChatProvider plugin={plugin}>
			<div className="ow-tabs-manager">
				{activeTab === 'THREAD' ? (
					<Thread
						plugin={plugin}
						handleTabSwitcher={handleTabSwitcher}

					/>
				) : (
					<Chat
						plugin={plugin}
						handleTabSwitcher={handleTabSwitcher}
					/>
				)}
			</div>
		</ChatProvider>
	)
}
