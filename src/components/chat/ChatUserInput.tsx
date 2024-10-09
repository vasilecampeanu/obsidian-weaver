import { Icon } from "components/primitives/Icon";
import { ChangeEvent, ClipboardEvent, useState } from "react";

const MAX_CHARACTERS = 2000;

interface ChatUserInputProps {}

export const ChatUserInput: React.FC<ChatUserInputProps> = () => {
	const [userInputMessage, setUserInputMessage] = useState<string>("");
	const [charCount, setCharCount] = useState<number>(0);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		setUserInputMessage("");
		setCharCount(0);
	};

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		let value = event.target.value;

		if (value.length > MAX_CHARACTERS) {
			value = value.slice(0, MAX_CHARACTERS);
		}

		setUserInputMessage(value);
		setCharCount(value.length);
	};

	const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
		event.preventDefault();

		const pasteData = event.clipboardData.getData("text");
		const remainingChars = MAX_CHARACTERS - userInputMessage.length;

		if (remainingChars <= 0) {
			return;
		}

		const trimmedData = pasteData.slice(0, remainingChars);
		const newValue = userInputMessage + trimmedData;

		setUserInputMessage(newValue);
		setCharCount(newValue.length);
	};

	return (
		<div className="ow-chat-user-input">
			<div className="ow-user-actions">
				<button
					className="ow-btn create-new-chat"
					type="button"
				>
					<Icon iconId="plus" />
				</button>
			</div>
			<div className="ow-chat-user-input-form-wrapper">
				<form onSubmit={handleSubmit}>
					<textarea
						placeholder="Ask me anything..."
						value={userInputMessage}
						onChange={handleChange}
						onPaste={handlePaste}
						maxLength={MAX_CHARACTERS} 
						className="ow-textarea"
					/>
					<button
						className="ow-btn submit"
						type="submit"
						disabled={userInputMessage.trim().length === 0}
					>
						<Icon iconId="send" />
					</button>
				</form>
				<div className="ow-inline-input-utilities">
					<div
						className={`ow-input-character-counter ${
							charCount > MAX_CHARACTERS
								? "ow-character-limit-exceeded"
								: ""
						}`}
					>
						{charCount}/{MAX_CHARACTERS}
					</div>
					<button
						className="ow-btn pin-input"
						type="button"
					>
						<Icon iconId="pin" />
					</button>
				</div>
			</div>
		</div>
	);
};
