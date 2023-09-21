import React from 'react';
import Weaver from 'main';
import { ChatInput } from './ChatInput';
import { TabId } from 'types/GeneralTypes';
import { useChatOperations } from 'hooks/useChatOperations';

interface ChatProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const Chat: React.FC<ChatProps> = ({ plugin, handleTabSwitcher }) => {
	const { conversation } = useChatOperations();

	return (
		<div className="ow-chat">
			<div className="ow-chat-header">
				<button
					onClick={() => {handleTabSwitcher('THREAD')}}
				>
					BACK TO THREAD VIEW
				</button>
				<div className="ow-chat-title">
					{conversation?.title}
				</div>
			</div>
			<div className="ow-chat-dialogue"></div>
			<ChatInput plugin={plugin} />
		</div>
	);
}
