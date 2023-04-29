import React from 'react';
import { SortHistory } from './SortHistory';
import Weaver from 'main';
import { eventEmitter } from 'utils/EventEmitter';

interface HeaderProps {
	plugin: Weaver;
	threadTitle: string;
	conversations: any[];
	handleNewChat: () => void;
	onTabSwitch: (tabId: string) => void;
	onSort: (sortOrder: 'asc' | 'desc') => void;
}

export const Header: React.FC<HeaderProps> = ({
	plugin,
	threadTitle,
	conversations,
	handleNewChat,
	onTabSwitch,
	onSort,
}) => {
	const handleNewChatClick = () => {
		handleNewChat();
		onTabSwitch("chat-view");
	};

	return (
		<div className="ow-thread-header">
			<div className="ow-thread-icon">
				<div className="ow-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-spline"><path d="M21 6V4c0-.6-.4-1-1-1h-2a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h2c.6 0 1-.4 1-1Z"></path><path d="M7 20v-2c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h2c.6 0 1-.4 1-1Z"></path><path d="M5 17A12 12 0 0 1 17 5"></path></svg>
				</div>
				<div className="ow-vertical-line"></div>
				<div className="ow-icon-dots">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
				</div>
			</div>
			<div className="ow-wrapper">
				<div className="ow-header">
					<div className="ow-title-bar">
						<div className="ow-title">
							<span className="title-wrapper">{threadTitle}</span>
							<span className="count-conversations">Conversations count: {conversations.length}</span>
						</div>
						<div className="ow-actions">
						</div>
					</div>
					<div className="ow-tool-bar">
						<button className="ow-btn-new-chat" onClick={handleNewChatClick}>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Create new conversation
						</button>
					</div>
				</div>
				{/* 
				<div className="ow-thread-banner">
					<img
						className="banner-image full-width draggable"
						draggable="false"
						src="app://local/Users/vasilecampeanu/Workspace/obsidian-bloom-copilot/abstract-low-poly-technology-banner-design-free-vector.jpg?1681651305594"
					/>
				</div>
				<div className="ow-thread-description">
					No description
				</div> 
				*/}
			</div>
		</div>
	);
};
