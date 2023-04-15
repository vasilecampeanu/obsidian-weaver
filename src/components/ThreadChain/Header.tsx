import React from 'react';
import { SortHistory } from './SortHistory';

interface HeaderProps {
    conversations: any[];
    handleNewChat: () => void;
    onTabSwitch: (tabId: string) => void;
	onSort: (sortOrder: 'asc' | 'desc') => void;
}

export const Header: React.FC<HeaderProps> = ({
	onSort,
    conversations,
    handleNewChat,
    onTabSwitch
}) => {
    const handleNewChatClick = () => {
        handleNewChat();
        onTabSwitch("chat-view");
    };

    return (
        <div className="header">
            <div className="tool-bar">
                <div className="title">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-spline"><path d="M21 6V4c0-.6-.4-1-1-1h-2a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h2c.6 0 1-.4 1-1Z"></path><path d="M7 20v-2c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h2c.6 0 1-.4 1-1Z"></path><path d="M5 17A12 12 0 0 1 17 5"></path></svg>
                    <span>Thread Chain</span>
                </div>
                <button className="btn-new-chat" onClick={handleNewChatClick}>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
            <div className="info-bar">
                <div className="chat-count">
                    Number of chats: {conversations.length}
                </div>
				<SortHistory onSort={onSort} />
            </div>
        </div>
    );
};
