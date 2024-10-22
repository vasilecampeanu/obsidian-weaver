import { useConversation } from "hooks/useConversation";
import { TabProvider, useTab } from "providers/tab/TabContext";
import { useEffect, useRef } from "react";
import { Chat } from "./chat/Chat";
import { ConversationList } from "./conversations/ConversationList";

export const Plugin = () => {
	const { initConversation } = useConversation();
	const initConversationCalled = useRef(false);

	useEffect(() => {
		if (!initConversationCalled.current) {
			initConversationCalled.current = true;
			initConversation();
		}
	}, [initConversation]);

	return (
		<TabProvider>
			<div className="obsidian-weaver">
				<MainContent />
			</div>
		</TabProvider>
	);
};

const MainContent = () => {
	const { currentTab } = useTab();

	return (
		<>
			{currentTab === "chat" && <Chat />}
			{currentTab === "conversationList" && <ConversationList />}
		</>
	);
};
