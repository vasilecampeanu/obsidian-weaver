// ThreadListItemRenderer.tsx
import React from 'react';
import { ThreadListItem } from "./ThreadListItem";
import { IConversation } from "interfaces/IThread";
import Weaver from "main";

interface ItemRendererProps {
	index: number;
	style: React.CSSProperties;
	item: any;
	plugin: Weaver;
	onConversationDeleted: (id: string) => void;
	onTabSwitch: (tabId: string) => void;
	onConversationLoad: (conversation: IConversation) => void;
}

export const ThreadListItemRenderer: React.FC<ItemRendererProps> = ({ 
	style, 
	item,
	plugin,
	onConversationDeleted,
	onTabSwitch,
	onConversationLoad
}) => {
	return (
		<div className="ow-list-item-wrapper" style={style}>
			<div className={`ow-identation-guides ${plugin.settings.threadViewIdentationGuides === false ? 'ow-hide-identation-guides' : null}`}>
			</div>
			<ThreadListItem
				key={item.id}
				plugin={plugin}
				conversation={item}
				onConversationDeleted={onConversationDeleted}
				onTabSwitch={onTabSwitch}
				onConversationLoad={onConversationLoad}
			/>
		</div>
	);
};
