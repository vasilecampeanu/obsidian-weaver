import React from 'react';
import { HistoryItem } from './HistoryItem';
import Weaver from 'main';

interface ChainHistoryProps {
	plugin: Weaver;
    conversations: any[];
    onConversationLoad: (conversationId: number) => void;
    onTabSwitch: (tabId: string) => void;
    fetchConversations: () => void;
}

export const ChainHistory: React.FC<ChainHistoryProps> = ({
    plugin,
	conversations,
    onConversationLoad,
    onTabSwitch,
    fetchConversations
}) => {
    return (
        <div className="chat-history">
            {conversations.map((conversation, index) => (
                <HistoryItem
					plugin={plugin}
                    key={index}
                    conversation={conversation}
                    onConversationLoad={onConversationLoad}
                    onTabSwitch={onTabSwitch}
                    fetchConversations={fetchConversations}
                />
            ))}
        </div>
    );
};
