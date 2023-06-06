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
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-arrow-up-to-line"><line x1="12" x2="12" y1="7" y2="21"/><polyline points="18 13 12 7 6 13"/><path d="M5 3h14"/></svg>
					<span>Submit</span>
				</button>
				<button
					onClick={handleCancel}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-circle-off"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>
					<span>Cancel</span>
				</button>
			</div>
		</div>
	)
}
