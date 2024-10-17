import { Icon } from "components/primitives/Icon";
import { useStore } from "providers/store/useStore";

interface ChatHeaderProps {}

export const ChatHeader: React.FC<ChatHeaderProps> = () => {
	const conversation = useStore((s) => s.conversation);

	return (
		<div className="ow-chat-header">
			<button className="ow-model-info-select">
				<span>
					<Icon iconId={"sparkles"} />
				</span>
				<span>{conversation?.default_model_slug.toUpperCase()}</span>
				<span>
					<Icon iconId={"chevron-down"} />
				</span>
			</button>
			<div className="ow-chat-title">{conversation?.title}</div>
		</div>
	);
};
