import { ChatDialogueFeed } from "./ChatDialogueFeed";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";

interface ChatProps {
}

export const Chat: React.FC<ChatProps> = () => {
	return (
		<div className="ow-chat">
			<ChatHeader />
			<ChatDialogueFeed />
			<ChatInput />
		</div>
	)
};
