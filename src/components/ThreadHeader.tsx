import { useChatOperations } from "hooks/useChatOperations";
import Weaver from "main";
import React, { useEffect } from "react";

import { TabId } from "types/GeneralTypes";
import { ConversationManager } from "utils/ConversationManager";

interface ThreadHeaderProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({ plugin, handleTabSwitcher }) => {
    const { createNewConversation } = useChatOperations();

    const handleCreateNewChat = () => {
        handleTabSwitcher('CHAT');
        createNewConversation();
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
