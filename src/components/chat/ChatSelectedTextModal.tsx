import { IUserSelection } from "interfaces/IChat";

interface ChatSelectedTextProps {
	userSelection: IUserSelection
}

export const ChatSelectedTextModal: React.FC<ChatSelectedTextProps> = ({ userSelection }) => {
	return (
		<div className="ow-selected-text-modal">
			{userSelection.text}
		</div>
	)
}
