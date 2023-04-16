import React, { useEffect } from 'react';
import { Header } from './Header';
import { ChainHistory } from './ChainHistory';
import { IChatSession } from 'interfaces/IChats';
import { ConversationHelper } from 'helpers/ConversationHelpers';

import Weaver from 'main';

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
	const activeThreadId = 0;

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
		const data = await ConversationHelper.getConversations(plugin, activeThreadId);
		setConversations(data);
    };

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