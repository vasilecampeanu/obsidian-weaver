import { ChatDialogueFeed } from "./ChatDialogueFeed";
import { ChatHeader } from "./ChatHeader";
import { ChatUserInput } from "./ChatUserInput";

interface ChatProps {
}

export const Chat: React.FC<ChatProps> = () => {
	return (
		<div className="ow-chat">
			<ChatHeader />
			<ChatDialogueFeed />
			<ChatUserInput />
		</div>
	)
};
