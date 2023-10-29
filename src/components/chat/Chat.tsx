import React, { useState } from 'react';
import Weaver from 'main';
import { ChatInput } from './input/ChatInput';
import { TabId } from 'types/GeneralTypes';
import { useChat } from 'hooks/useChat';
import { ChatDialogue } from 'components/ChatDialogue';
import { ChatHeader } from './ChatHeader';

interface ChatProps {
	plugin: Weaver,
	handleTabSwitcher: (tabId: TabId) => void
}

export const Chat: React.FC<ChatProps> = ({ plugin, handleTabSwitcher }) => {
	const { conversation } = useChat();

	return (
		<div className="ow-chat">
			<ChatHeader plugin={plugin} handleTabSwitcher={handleTabSwitcher} />
			<ChatDialogue conversation={conversation} />
			<ChatInput plugin={plugin} />
		</div>
	);
}
