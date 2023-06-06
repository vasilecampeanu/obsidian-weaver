import { IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo } from "react";
import { ConversationDialogue } from "./ConversationDialogue";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";

interface ConversationSettingsProps {
	plugin: Weaver;
	conversation: IConversation
}

export const ConversationSettings: React.FC<ConversationSettingsProps> = ({
	plugin,
	conversation
}) => {
	return (
		<div className="ow-conversation-settings">
			<div className="ow-title-bar">
				<span>Settings Tab</span>
				<div className="ow-user-actions">
					<button>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down"><polyline points="6 9 12 15 18 9"/></svg>
					</button>
				</div>
			</div>
			<div className="ow-settings">
			</div>
		</div>
	)
}
