import { Icon } from "components/primitives/Icon";
import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, ClipboardEvent, useState } from "react";

const MAX_CHARACTERS = 2000;

const buttonVariants = {
	hidden:  { opacity: 0 },
	visible: { opacity: 1 },
	exit:    { opacity: 0 },
};

interface ChatUserInputProps {}

export const ChatUserInput: React.FC<ChatUserInputProps> = () => {
	const [userInputMessage, setUserInputMessage] = useState<string>("");
	const [charCount, setCharCount] = useState<number>(0);
	const [isHovered, setIsHovered] = useState<boolean>(false);
	const [isFocused, setIsFocused] = useState<boolean>(false);

	// Determine if the input area should be expanded
	const isExpanded = isHovered || isFocused || userInputMessage.length > 0;

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
			<div className="ow-chat-user-input-sugestions">
			</div>
			<div className="ow-chat-user-input-toolbar">
				<button className="ow-btn assistant-response-stop">
					<Icon iconId="circle-off" />
				</button>
				<button className="ow-btn assistant-response-regenarte">
					<Icon iconId="refresh-cw" />
				</button>
			</div>	
			<div className="ow-chat-user-input-inner-wrapper">
				<div className="ow-user-actions">
					<AnimatePresence>
						{!isHovered && (
							<motion.button
								className="ow-btn create-new-chat"
								type="button"
								variants={buttonVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								transition={{ duration: 0.2, ease: "easeInOut" }}
							>
								<Icon iconId="plus" />
							</motion.button>
						)}
					</AnimatePresence>
				</div>
				<motion.div
					className="ow-chat-user-input-form-wrapper"
					onHoverStart={() => setIsHovered(true)}
					onHoverEnd={() => setIsHovered(false)}
					initial={{ marginLeft: 0, width: "calc(100% - 50px)" }}
					animate={{
						marginLeft: isHovered ? -50 : 0,
						width: isHovered ? "100%" : "calc(100% - 50px)",
					}}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					<form onSubmit={handleSubmit}>
						<motion.textarea
							placeholder="Ask me anything..."
							value={userInputMessage}
							onChange={handleChange}
							onPaste={handlePaste}
							maxLength={MAX_CHARACTERS}
							className="ow-textarea"
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							animate={{ height: isExpanded ? "6em" : "2em" }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						/>
						{userInputMessage.length > 0 && (
							<button
								className="ow-btn submit"
								type="submit"
								disabled={userInputMessage.trim().length === 0}
							>
								<Icon iconId="send" />
							</button>
						)}
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
						<button className="ow-btn pin-input" type="button">
							<Icon iconId="pin" />
						</button>
					</div>
				</motion.div>
			</div>
		</div>
	);
};
