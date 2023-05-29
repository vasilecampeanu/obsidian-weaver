import { IConversation } from "interfaces/IThread";
import Weaver from "main"
import LocalJsonModal from "modals/ImportModal";
import React, { useState } from "react"
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
	// declare a new state variable to keep track of visibility status
	const [isSearchVisible, setSearchVisibility] = useState(false);

	const handleCreateNewConversation = async () => {
		const newConversation = await ConversationManager.createNewConversation(plugin);
		onConversationLoad(newConversation);
		onTabSwitch("conversation-page");
	}

	const handleHideSearch = () => {
		setSearchVisibility(!isSearchVisible);
	}

	const handleOpenImportModal = () => {
		new LocalJsonModal(plugin).open();
	}
	
	return (
		<div className="ow-thread-header">
			<div className="ow-thread-title">
				<div className="ow-title">
					Thread View
				</div>
				<div className="ow-actions">
					<button
						onClick={handleHideSearch}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" x2="16.65" y1="21" y2="16.65"></line></svg>
					</button>
					<button
						onClick={handleOpenImportModal}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
					</button>
					<button
						onClick={handleCreateNewConversation}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
					</button>
				</div>
			</div>
			<div className="search-row">
				{isSearchVisible && (
					<div className="search-input-container">
						<input
							type="search"
							spellCheck="false"
							placeholder="Search..."
							value={searchTerm}
							onChange={onSearchChange}
						/>
					</div>
				)}
				<div className="ow-messages-count">
					{messagesCount} conversations
				</div>
				<hr />
			</div>
		</div>
	);
};
