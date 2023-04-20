import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { ChainHistory } from './ChainHistory';
import { IChatSession } from 'interfaces/IChats';
import { ConversationHelper } from 'helpers/ConversationHelpers';

import Weaver from 'main';
import { ThreadsManager } from 'utils/ThreadsManager';
import { eventEmitter } from 'utils/EventEmitter';

interface ThreadChainProps {
	plugin: Weaver,
	onTabSwitch: (tabId: string) => void,
	onConversationLoad: (conversationId: number) => void,
	onNewConversation: () => void;
}

export const ThreadChain: React.FC<ThreadChainProps> = ({
	plugin,
	onTabSwitch,
	onConversationLoad,
	onNewConversation
}) => {
	const [conversations, setConversations] = React.useState<IChatSession[]>([]);
	const activeThreadId = plugin.settings.activeThreadId;

	const fetchConversations = async () => {
		console.log(plugin.settings.activeThreadId);
		const conversations = await ThreadsManager.getConversations(plugin, activeThreadId);
		setConversations(conversations);
	};

	useEffect(() => {
		fetchConversations();
	}, []);

	const handleSort = (sortOrder: 'asc' | 'desc') => {
		const sortedConversations = [...conversations].sort((a, b) => {
			const dateA = new Date(a.creationDate);
			const dateB = new Date(b.creationDate);

			return sortOrder === 'asc'
				? dateA.getTime() - dateB.getTime()
				: dateB.getTime() - dateA.getTime();
		});

		setConversations(sortedConversations);
	};

	return (
		<div className="home-page">
			<Header
				plugin={plugin}
				onSort={handleSort}
				conversations={conversations}
				handleNewChat={onNewConversation}
				onTabSwitch={onTabSwitch}
			/>
			<ChainHistory
				plugin={plugin}
				conversations={conversations}
				onConversationLoad={onConversationLoad}
				onTabSwitch={onTabSwitch}
				fetchConversations={fetchConversations}
			/>
		</div>
	);
};
