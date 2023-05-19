import Weaver from "main"
import React, { useEffect, useState } from "react"

import { Thread } from "./Thread"

import { eventEmitter } from 'utils/EventEmitter';
import { Conversation } from "components/Conversation/Conversation";
import { IConversation } from "interfaces/IThread";

interface ThreadTabsManagerProps {
	plugin: Weaver,
}

export const ThreadTabsManager: React.FC<ThreadTabsManagerProps> = ({plugin}) => {
	const [activeTab, setActiveTab] = useState("thread-page");
	const [reloadTrigger, setReloadTrigger] = React.useState<number>(0);
	const [conversation, setConversation] = useState<IConversation | undefined>();

	useEffect(() => {
		const handleReload = async () => {
			setActiveTab("thread-page");
			setReloadTrigger((prevTrigger) => prevTrigger + 1);
		};

		eventEmitter.on('reloadThreadViewEvent', handleReload);

		return () => {
			eventEmitter.off('reloadThreadViewEvent', handleReload);
		};
	}, []);

	const handleTabSwitch = (tabId: string) => {
		setActiveTab(tabId);
	}

	const handleConversationLoad = (conversation: IConversation) => {
		setConversation(conversation);
	};

	return (
		<div className="ow-thread-tabs-manager" key={reloadTrigger}>
			{activeTab === "thread-page" ? (
				<Thread 
					plugin={plugin} 
					onTabSwitch={handleTabSwitch}
					onConversationLoad={handleConversationLoad}
				/>
			) : (
				<Conversation 
					plugin={plugin} 
					onTabSwitch={handleTabSwitch}
					conversation={conversation}
					onConversationLoad={handleConversationLoad}
				/>
			)}
		</div>
	)
}
