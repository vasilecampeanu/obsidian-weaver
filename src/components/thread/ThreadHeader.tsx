import Weaver from "main";
import React from "react";

import { useChatOperations } from "hooks/useChatOperations";
import { TabId } from "types/GeneralTypes";

interface ThreadHeaderProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({ plugin, handleTabSwitcher }) => {
    const { createNewConversation } = useChatOperations();

    const handleCreateNewChat = () => {
        createNewConversation();
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
