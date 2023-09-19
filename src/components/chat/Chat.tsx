import React from 'react';
import Weaver from 'main';
import { ChatInput } from './ChatInput';
import { TabId } from 'types/GeneralTypes';
import { ConversationManager } from 'utils/ConversationManager';

interface ChatProps {
	plugin: Weaver,
	conversationManager: ConversationManager,
	handleTabSwitcher: (tabId: TabId) => void
}

export const Chat: React.FC<ChatProps> = ({ plugin, handleTabSwitcher }) => {
	return (
		<div className="ow-chat">
			<div className="ow-chat-header">
				<button
					onClick={() => {handleTabSwitcher('THREAD')}}
				>
					BACK TO THREAD VIEW
				</button>
			</div>
			<div className="ow-chat-dialogue"></div>
			<ChatInput plugin={plugin} />
		</div>
	);
}
