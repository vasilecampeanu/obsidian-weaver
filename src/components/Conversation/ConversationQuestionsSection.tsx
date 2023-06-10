import { IChatMessage, IConversation } from "interfaces/IThread";
import Weaver from "main";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { ConversationManager } from "utils/ConversationManager";
import { OpenAIMessageDispatcher } from "utils/api/OpenAIMessageDispatcher";
import { ConversationSelectedText } from "./ConversationSelectedText";
import { eventEmitter } from "utils/EventEmitter";

interface ConversationQuestionsSectionProps {
	plugin: Weaver;
	conversation: IConversation | undefined;
}

export const ConversationQuestionsSection: React.FC<ConversationQuestionsSectionProps> = ({
	plugin,
	conversation
}) => {
	return (
		<div className="ow-conversation-questions">
			<div className="ow-conversation-questions-inner">
				<div className="ow-question">How can you help me?</div>
				<div className="ow-question">What can you do?</div>
				<div className="ow-question">What are your functions?</div>
			</div>
		</div>
	)
}
