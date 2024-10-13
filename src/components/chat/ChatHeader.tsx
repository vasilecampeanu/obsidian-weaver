import { useStore } from "providers/store/useStore";

interface ChatHeaderProps {
}

export const ChatHeader: React.FC<ChatHeaderProps> = () => {
	const conversation = useStore((s) => s.conversation);

	return (
		<div className="ow-chat-header">
			<div className="ow-chat-title">
				{conversation?.title}
			</div>
		</div>
	)
};
