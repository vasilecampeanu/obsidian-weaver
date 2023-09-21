import Weaver from "main";
import React from "react";

import { TabId } from "types/GeneralTypes";
import { ThreadHeader } from "./ThreadHeader";

interface ThreadProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const Thread: React.FC<ThreadProps> = ({ plugin, handleTabSwitcher }) => {
	return (
		<div className="ow-thread">
			<ThreadHeader plugin={plugin} handleTabSwitcher={handleTabSwitcher} />
			<div className="ow-chat-list">
			</div>
		</div>
	)
}
