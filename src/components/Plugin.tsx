import { useConversation } from "hooks/useConversation";
import { useEffect, useRef } from "react";
import { Chat } from "./chat/Chat";

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
		<div className="obsidian-weaver">
			<Chat />
		</div>
	);
};
