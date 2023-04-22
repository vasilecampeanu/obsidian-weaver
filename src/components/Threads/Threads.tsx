import React, { useEffect, useState, useRef } from 'react';
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
	const [threads, setThreads] = useState<IChatThread[]>([]);
	const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
	const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
	const [editedTitle, setEditedTitle] = useState<string>('');

	const editTitleInputRef = useRef<HTMLInputElement>(null);

	const fetchThreads = async () => {
		const threads = await ThreadsManager.getThreads(plugin);
		console.log(threads);
		setThreads(threads);
	};

	useEffect(() => {
		fetchThreads();
	}, []);

	useEffect(() => {
		if (editingThreadId !== null && editTitleInputRef.current) {
			editTitleInputRef.current.focus();
		}
	}, [editingThreadId]);	

	const handleEditTitle = (threadId: number, title: string) => {
		setEditingThreadId(threadId);
		setEditedTitle(title);
	};

	const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setEditedTitle(event.target.value);
	};

	const handleTitleSave = async (threadId: number) => {
		if (editedTitle.trim() !== '') {
			const response = await ThreadsManager.updateThreadTitle(plugin, threadId, editedTitle);
			if (response.success) {
				fetchThreads();
			} else {
				// Handle error, e.g., show a notification with the error message
			}
		}
		setEditingThreadId(null);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, threadId: number) => {
		if (event.key === 'Enter') {
			handleTitleSave(threadId);
		}
	};

	const handleBlur = (threadId: number) => {
		handleTitleSave(threadId);
	};

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

	const handleChnageActiveThread = (id: number, title: string) => {
		eventEmitter.emit('reloadEvent');

		plugin.settings.activeThreadId = id;
		plugin.settings.activeThreadTitle = title;
		plugin.saveSettings();

		console.log(plugin.settings.activeThreadId);
		console.log(plugin.settings.activeThreadTitle);
	}

	const handleDelete = (threadId: number, event: React.MouseEvent) => {
		event.stopPropagation();
		setSelectedThreadId(threadId);
	};

	const handleCloseDeleteConfirmation = (event: React.MouseEvent) => {
		event.stopPropagation();
		setSelectedThreadId(null);
	};

	const handleDeleteConfirmed = async (threadId: number, event: React.MouseEvent) => {
		event.stopPropagation();
		await ThreadsManager.deleteThreadById(plugin, threadId);
		fetchThreads();
		setSelectedThreadId(null);
	};

	return (
		<div className="ow-threads">
			<div className="header">
				<div className="title">
					<span className="wrapper">Threads</span>
					<span className="threads-count">Number of threads: {threads.length}</span>
				</div>
				<div className="actions">
					<button
						onClick={handleCreateNewThread}
						className="ow-btn-create-new-thread"
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
							onClick={() => handleChnageActiveThread(thread.id, thread.title)}
							key={index}
						>
							<div className="ow-title">
								<div className="content">
									<span className="icon">
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-git-merge"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>
									</span>
									<span className="title-wrapper">
										{editingThreadId === thread.id ? (
											<input
												ref={editTitleInputRef}
												type="text"
												value={editedTitle}
												onChange={handleTitleChange}
												onKeyDown={(event) => handleKeyDown(event, thread.id)}
												onBlur={() => handleBlur(thread.id)}
											/>
										) : (
											<>
												{thread.title}
											</>
										)}
									</span>
								</div>
								<div className={`ow-actions ${selectedThreadId === thread.id ? 'show' : ''}`}>
									{selectedThreadId === thread.id ? (
										<div className="delete-confirmation-dialog">
											<button className="btn-confirm" onClick={(event) => {
												handleDeleteConfirmed(thread.id, event)
											}}>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
											</button>
											<button className="btn-cancel" onClick={(event) => {
												handleCloseDeleteConfirmation(event)
											}}>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
											</button>
										</div>
									) : (
										<>
											{editingThreadId === thread.id ? (
												<></>
											) : (
												<button
													className="btn-edit-title"
													onClick={(event) => {
														event.stopPropagation();
														handleEditTitle(thread.id, thread.title);
													}}
												>
													<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-edit-3"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
												</button>
											)}
											<button
												className="btn-delete-conversation"
												onClick={(event) => handleDelete(thread.id, event)}
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
											</button>
										</>
									)}
									<button
										className="btn-open-chat"
										onClick={() => handleChnageActiveThread(thread.id, thread.title)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
									</button>
								</div>
								<div className={`ow-msg-count ${selectedThreadId === thread.id ? 'show' : ''}`}>
									{thread.conversations.length}
								</div>
							</div>
						</div>
					))
				}
			</div>
		</div>
	);
}
