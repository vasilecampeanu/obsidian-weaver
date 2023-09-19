import Weaver from "main";
import React from "react";

import { TabId } from "types/GeneralTypes";
import { ConversationManager } from "utils/ConversationManager";

interface ThreadHeaderProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({ plugin, handleTabSwitcher }) => {
	const conversationManager = new ConversationManager(plugin);

	const handleCreateNewChat = async () => {
		handleTabSwitcher('CHAT');
		const newConversation = await conversationManager.createNewConversation();
		console.log(newConversation);
	}

	return(
		<div className="ow-thread-header">
			<div className="ow-title">
				THREAD-VIEW
			</div>
			<div className="ow-actions">
				<button
					onClick={handleCreateNewChat}
				>
					NEW CHAT
				</button>
			</div>
		</div>
	)
}
