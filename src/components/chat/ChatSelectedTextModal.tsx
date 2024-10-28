import { MarkdownContent } from "components/primitives/MarkdownContent";
import { IUserSelection } from "interfaces/IUserEvents";

interface ChatSelectedTextProps {
	userSelection: IUserSelection;
	setUserSelection: React.Dispatch<React.SetStateAction<IUserSelection | null>>;
}

export const ChatSelectedTextModal: React.FC<ChatSelectedTextProps> = ({
	userSelection,
	setUserSelection,
}) => {
	return (
		<div className="ow-selected-text-modal">
			<div className="ow-modal-title">Selected content</div>
			<div className="ow-user-selection">
				<MarkdownContent content={userSelection.text} />
			</div>
			<div className="ow-actions">
				<button 
					className="ow-btn cancel"
					onClick={() => {setUserSelection(null)}}
				>
					Cancel
				</button>
			</div>
		</div>
	);
};
