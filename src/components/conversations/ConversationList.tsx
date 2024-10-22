import { formatTimestampWithIntl } from "helpers/Time";
import { useConversation } from "hooks/useConversation";
import { useConversationList } from "hooks/useConversationList";
import { useTab } from "providers/tab/TabContext";

interface ConversationListProps {}

export const ConversationList: React.FC<ConversationListProps> = () => {
	const { conversations, loading, error } = useConversationList();
	const { switchToChat } = useTab();
	const { conversation, loadConversation } = useConversation();

	return (
		<div className="ow-conversation-list">
			<div className="ow-title">
				Conversation List
			</div>
			<div className="ow-list">
				{conversations.map((conversation) => (
					<div
						className="ow-conversation-preview-card"
						key={conversation.id}
						onClick={async () => {
							await loadConversation(conversation.id);
							switchToChat();
						}}
					>
						<div className="ow-conversation-title">
							{conversation.title}
						</div>
						<div className="ow-conversation-date">
							{formatTimestampWithIntl(conversation.create_time)}	
						</div>
					</div>
				))}
			</div>
		</div>	
	)
}
