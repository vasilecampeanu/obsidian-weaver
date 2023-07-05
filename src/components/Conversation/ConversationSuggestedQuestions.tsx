import { IChatMessage, IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { ConversationManager } from "utils/ConversationManager";
import { OpenAIMessageDispatcher } from "utils/api/OpenAIMessageDispatcher";
import { ConversationSelectedText } from "./ConversationSelectedText";
import { eventEmitter } from "utils/EventEmitter";

interface ConversationSuggestedQuestionsProps {
	plugin: Weaver;
	conversation: IConversation | undefined;
}

export const ConversationSuggestedQuestions: React.FC<ConversationSuggestedQuestionsProps> = ({
	plugin,
	conversation
}) => {
	useEffect(() => {
		console.log(conversation);
	}, [])

	const operations = ['Explain', 'Revise', 'Sumarize', 'Expand'];  // Add your operations here

	// Find the last assistant message
	const lastAssistantMessage = conversation?.messages.slice().reverse().find(message => message.author.role === 'assistant');

	return (
		conversation!?.messages.length < 2 ? (
			<div className="ow-conversation-questions">
				<div className="ow-conversation-questions-inner">
					<div className="ow-question">How can you help me?</div>
					<div className="ow-question">What can you do?</div>
					<div className="ow-question">What are your functions?</div>
				</div>
			</div>
		) : (
			lastAssistantMessage && lastAssistantMessage.content.content_type === 'question' ? (
				<div className="ow-conversation-questions">
					<div className="ow-conversation-questions-inner">
						{operations.map((operation, index) =>
							<div key={index} className="ow-question">{operation}</div>
						)}
					</div>
				</div>
			) : null
		)
	)
}
