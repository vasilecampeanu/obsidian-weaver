import { IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo } from "react";
import { ConversationDialogue } from "./ConversationDialogue";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { ConversationSettings } from "./ConversationSettings";

interface ConversationProps {
	plugin: Weaver;
	onTabSwitch: (tabId: string) => void;
	conversation: IConversation | undefined;
	onConversationLoad: (conversation: IConversation) => void;
}

export const Conversation: React.FC<ConversationProps> = ({
	plugin,
	onTabSwitch,
	conversation,
	onConversationLoad
}) => {
	const [conversationSession, setConversationSession] = useState<IConversation | undefined>();
	const [showConversationSettings, setShowConversationSettings] = useState<boolean>(false);

	useEffect(() => {
		setConversationSession(conversation);
	}, []);

	return (
		<div className="ow-conversation">
			<ConversationHeader
				plugin={plugin}
				conversation={conversationSession}
				onTabSwitch={onTabSwitch}
				setConversationSession={setConversationSession}
				showConversationSettings={showConversationSettings}
				setShowConversationSettings={setShowConversationSettings}
			/>
			<ConversationDialogue
				plugin={plugin}
				conversation={conversationSession}
				setConversationSession={setConversationSession}
			/>
			<ConversationInput
				plugin={plugin}
				conversation={conversationSession}
				setConversationSession={setConversationSession}
				onConversationLoad={onConversationLoad}
				onTabSwitch={onTabSwitch}
			/>
			{showConversationSettings === true ? (
				<ConversationSettings 
					plugin={plugin} 
					conversation={conversation as IConversation}
				/>
			) : null}
		</div>
	);
}
