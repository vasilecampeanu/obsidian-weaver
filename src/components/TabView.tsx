import React, { useState } from 'react';
import { ChatView } from './ChatView';
import { HistoryView } from './History View';

import Weaver from 'main'

export const TabView: React.FC<{ plugin: Weaver }> = ({ plugin }) => {
	const [activeTab, setActiveTab] = useState('chat');

	return (
		<div>
			<ul className="tab-header">
				<li className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
					Chat
				</li>
				<li className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
					History
				</li>
			</ul>
			<div className="tab-content">
				{activeTab === 'chat' ? <ChatView plugin={plugin} /> : <HistoryView />}
			</div>
		</div>
	);
};

