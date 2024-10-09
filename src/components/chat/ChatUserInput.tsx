import { Icon } from "components/primitives/Icon";

interface ChatUserInputProps {}

export const ChatUserInput: React.FC<ChatUserInputProps> = () => {
	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
	};

	return (
		<div className="ow-chat-user-input">
			<div className="ow-user-actions">
				<button>
					<Icon iconId="plus" />
				</button>				
			</div>
			<div className="ow-chat-user-input-form-wrapper">
				<form onSubmit={handleSubmit}>
					<textarea placeholder="Ask me anything..." />
					<button>
						<Icon iconId="send" />
					</button>
				</form>
				<div className="ow-inline-input-utilities">
					<div className="ow-input-character-counter">0/2000</div>
					<button>
						<Icon iconId="pin" className="ow-icon-pin-input" />
					</button>
				</div>
			</div>
		</div>
	);
};
