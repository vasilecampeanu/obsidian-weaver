import React, { useEffect } from 'react';
import { IChatSession, IChatThread } from 'interfaces/IChats';
import { ConversationHelper } from 'helpers/ConversationHelpers';

import Weaver from 'main';
import { ThreadsManager } from 'utils/ThreadsManager';
import { eventEmitter } from 'utils/EventEmitter';

interface ThreadsProps {
    plugin: Weaver
}

export const Threads: React.FC<ThreadsProps> = ({
	plugin
}) => {
	const [threads, setThreads] = React.useState<IChatThread[]>([]);

    const fetchThreads = async () => {
		const threads = await ThreadsManager.getThreads(plugin);
		console.log(threads);
		setThreads(threads);
    };

    useEffect(() => {
        fetchThreads();
    }, []);

	const handleCreateNewThread = async () => {
		const existingChatSessions = await ThreadsManager.getThreads(plugin);

		let newTitle = 'Untitled';
		let index = 1;

		while (existingChatSessions.some((session) => session.title === newTitle)) {
			newTitle = `Untitled ${index}`;
			index++;
		}

		const newThread: IChatThread = {
			conversations: [],
			description: '',
			id: Date.now(),
			title: newTitle,
		}

		await ThreadsManager.addNewThread(plugin, newThread);
		fetchThreads();
	}

	const handleChnageActiveThread = (id: number) => {
		plugin.settings.activeThread = id;
		eventEmitter.emit('reloadEvent');
		console.log(plugin.settings.activeThread);
	}

	return (
		<div className="ow-threads">
			<div className="header">
				<div className="title">Threads</div>
				<div className="actions">
					<button
						onClick={handleCreateNewThread}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-plus"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>
					</button>
				</div>
			</div>
			<div 
				className="ow-threads-list"
			>
			{
				threads.map((thread, index) => (
					<div 
						className="ow-thread-item"
						onClick={() => handleChnageActiveThread(thread.id)}
					>
						{thread.title}
					</div>
				))
			}
			</div>
		</div>
	);
}
