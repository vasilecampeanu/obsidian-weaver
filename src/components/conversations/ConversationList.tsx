import { Icon } from "components/primitives/Icon";
import { formatTimestampWithIntl } from "helpers/Time";
import { useConversation } from "hooks/useConversation";
import { useConversationList } from "hooks/useConversationList";
import { useTab } from "providers/tab/TabContext";

interface ConversationListProps {}

export const ConversationList: React.FC<ConversationListProps> = () => {
	const { conversations, loading, error } = useConversationList();
	const { switchToChat } = useTab();
	const { conversation, loadConversation, initConversation } = useConversation();

	const sortedConversations = [...conversations].sort(
		(a, b) =>
			new Date(b.create_time).getTime() -
			new Date(a.create_time).getTime()
	);

	return (
		<div className="ow-conversation-list">
			<div className="ow-conversation-list-header">
				<div className="ow-title">Conversation List</div>
				<div className="ow-actions">
					<button
						className="ow-btn new"
						onClick={async () => {
							await initConversation(true);
							switchToChat();
						}}
					>
						<Icon iconId="plus" />
					</button>
				</div>
			</div>
			<div className="ow-list">
				{sortedConversations.map((conversation) => (
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
	);
};
