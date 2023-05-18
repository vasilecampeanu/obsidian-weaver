import { IConversation } from "interfaces/IThread";
import Weaver from "main"
import React from "react"
import { ConversationManager } from "utils/ConversationManager";

interface ThreadHeaderProps {
	plugin: Weaver;
	messagesCount: number;
	searchTerm: string;
	onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onTabSwitch: (tabId: string) => void;
	onConversationLoad: (conversation: IConversation) => void;
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({
	plugin,
	messagesCount,
	searchTerm,
	onSearchChange,
	onTabSwitch,
	onConversationLoad
}) => {
	const handleCreateNewConversation = async () => {
		const newConversation = await ConversationManager.createNewConversation(plugin);
		onConversationLoad(newConversation);
		onTabSwitch("conversation-page");
	}

	return (
		<div className="ow-thread-header">
			<div className="ow-thread-title">
				<div className="ow-title">
					Base Thread
				</div>
				<div className="ow-actions">
					<button
						onClick={handleCreateNewConversation}
					>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
					</button>
				</div>
			</div>
			<div className="search-row">
				<div className="search-input-container">
					<input
						type="search"
						spellCheck="false"
						placeholder="Search..."
						value={searchTerm}
						onChange={onSearchChange}
					/>
				</div>
				<div className="ow-messages-count">
					{messagesCount} conversations
				</div>
				<hr />
			</div>
		</div>
	);
};
