import Weaver from "main";
import React from "react";

import { useChat } from "hooks/useChat";
import { TabId } from "types/GeneralTypes";

interface ThreadHeaderProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({ plugin, handleTabSwitcher }) => {
    const { createConversation } = useChat();

    const handleCreateNewChat = () => {
        createConversation();
        handleTabSwitcher('CHAT');
    };
	
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
