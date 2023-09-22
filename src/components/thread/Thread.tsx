import Weaver from "main";
import React, { useEffect } from "react";

import { TabId } from "types/GeneralTypes";
import { ThreadHeader } from "./ThreadHeader";
import { useThread } from "hooks/useThread";

interface ThreadProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const Thread: React.FC<ThreadProps> = ({ plugin, handleTabSwitcher }) => {
	const { thread, getAllConversations } = useThread();

	useEffect(() => {
		getAllConversations();
	})

	return (
		<div className="ow-thread">
			<ThreadHeader plugin={plugin} handleTabSwitcher={handleTabSwitcher} />
			<div className="ow-chat-list">
				{thread?.map((conversation) => {
					return (
						<div 
							key={conversation.id}
							className="ow-list-item"
						>
							{conversation.title}
						</div>
					)
				})}
			</div>
		</div>
	)
}
