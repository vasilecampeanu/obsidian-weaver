import React, { useState, Dispatch, SetStateAction, useRef } from 'react';
import Weaver from "main";
import { OpenAIMessageDispatcher } from 'utils/api/OpenAIMessageDispatcher';
import { IChatMessage, IConversation } from 'interfaces/IThread';

interface ConversationSelectedTextProps {
	plugin: Weaver,
	selectedText: string;
	setSelectedText: Dispatch<SetStateAction<string>>;  
	conversation: IConversation | undefined;
	setConversationSession: React.Dispatch<React.SetStateAction<IConversation | undefined>>;
	updateConversation: (newMessage: IChatMessage, callback: (updatedMessages: IChatMessage[]) => void) => void;
	getRenderedMessages: (conversation: IConversation | null | undefined) => IChatMessage[];
}

export const ConversationSelectedText: React.FC<ConversationSelectedTextProps> = ({
	plugin,
	selectedText,
	setSelectedText,
	conversation,
	setConversationSession,
	updateConversation,
	getRenderedMessages
}) => {
	const messageDispatcherRef = useRef<OpenAIMessageDispatcher | null>(null);

	const handleSubmit = () => {
		messageDispatcherRef.current = new OpenAIMessageDispatcher(
			plugin,
			conversation as IConversation,
			setConversationSession,
			updateConversation
		);

		messageDispatcherRef.current.submitSelectedTextToChat(
			getRenderedMessages,
			selectedText
		);

		setSelectedText("")
	}

	const handleCancel = () => {
		setSelectedText("")
	}

	return(
		<div className="ow-selected-text">
			<div className="ow-title">
				Send selected text to chat?
			</div>
			<div className="ow-selected-text-content">
				{selectedText}
			</div>
			<div className="ow-user-actions">
				<button
					onClick={handleSubmit}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-send"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
					<span>Submit</span>
				</button>
				<button
					onClick={handleCancel}
					className='ow-cancel'
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-x"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
					<span>Cancel</span>
				</button>
			</div>
		</div>
	)
}
