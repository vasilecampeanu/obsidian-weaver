import React, { useState } from 'react';
import Weaver from 'main';
import { ChatInput } from './input/ChatInput';
import { TabId } from 'types/GeneralTypes';
import { useChat } from 'hooks/useChat';
import { ChatDialogue } from 'components/ChatDialogue';

interface ChatProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const Chat: React.FC<ChatProps> = ({ plugin, handleTabSwitcher }) => {
	const { conversation } = useChat();

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
			<ChatDialogue conversation={conversation} />
			<ChatInput plugin={plugin} />
		</div>
	);
}
