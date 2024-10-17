import { Icon } from "components/primitives/Icon";
import { AnimatePresence, motion } from "framer-motion";
import { useConversation } from "hooks/useConversation";
import { IUserSelection } from "interfaces/IUserEvents";
import { usePlugin } from "providers/plugin/usePlugin";
import {
	ChangeEvent,
	ClipboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { ChatSelectedTextModal } from "./ChatSelectedTextModal";

const MAX_CHARACTERS = 2000;
const TEXTAREA_LINE_HEIGHT = 14;

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
	const [isPinned, setIsPinned] = useState<boolean>(false);

	const [userSelection, setUserSelection] = useState<IUserSelection>();

	const plugin = usePlugin();
	const conversation = useConversation();

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);

	useEffect(() => {
		if (!plugin) return;

		const handleSelectionChanged = (event: IUserSelection) => {
			setUserSelection(event);
		};

		plugin.events.on("selection-changed", handleSelectionChanged);

		return () => {
			plugin.events.off("selection-changed", handleSelectionChanged);
		};
	}, [plugin]);

	useEffect(() => {
		const handleWindowFocus = () => setIsWindowFocused(true);
		const handleWindowBlur = () => setIsWindowFocused(false);

		window.addEventListener("focus", handleWindowFocus);
		window.addEventListener("blur", handleWindowBlur);

		return () => {
			window.removeEventListener("focus", handleWindowFocus);
			window.removeEventListener("blur", handleWindowBlur);
		};
	}, []);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		try {
			// Do this early
			setUserInputMessage("");
			setCharCount(0);

			// Generate assistant response
			await conversation?.generateAssistantMessage(userInputMessage);
		} catch (error) {
			console.error("Error sending message:", error);
		}
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

	const handleFocus = () => {
		setIsFocused(true);
	};

	const handleBlur = () => {
		setTimeout(() => {
			if (isWindowFocused) {
				if (document.activeElement !== textareaRef.current) {
					setIsFocused(false);
				}
			} else {
				setIsFocused(false);
			}
		}, 0);
	};

	const isExpanded = isHovered || isFocused || userInputMessage.length > 0 || isPinned;

	return (
		<div
			className="ow-chat-user-input"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{userSelection && (
				<ChatSelectedTextModal userSelection={userSelection} />
			)}
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
								transition={{
									duration: 0.2,
									ease: "easeInOut",
								}}
							>
								<Icon
									iconId="message-circle-plus"
									className="new-chat-icon"
								/>
							</motion.button>
						)}
					</AnimatePresence>
				</div>
				<motion.div
					className="ow-chat-user-input-form-wrapper"
					initial={{ marginLeft: 0, width: "calc(100% - 50px)" }}
					animate={{
						marginLeft: isHovered ? -50 : 0,
						width: isHovered ? "100%" : "calc(100% - 50px)",
					}}
					transition={{ duration: 0.3, ease: "easeInOut" }}
				>
					<form onSubmit={handleSubmit}>
						<motion.textarea
							ref={textareaRef}
							placeholder="Ask me anything..."
							value={userInputMessage}
							onChange={handleChange}
							onPaste={handlePaste}
							maxLength={MAX_CHARACTERS}
							className="ow-textarea"
							onFocus={handleFocus}
							onBlur={handleBlur}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
							initial={{
								height: `${2 * TEXTAREA_LINE_HEIGHT}px`,
							}}
							animate={{
								height: 
									isPinned
									? `${12 * TEXTAREA_LINE_HEIGHT}px` : isExpanded
									? `${6  * TEXTAREA_LINE_HEIGHT}px`
									: `${3  * TEXTAREA_LINE_HEIGHT}px`
							}}
							transition={{ duration: 0.3, ease: "easeInOut" }}
						/>
						{userInputMessage.length > 0 ? (
							<button
								className="ow-btn submit"
								type="submit"
								disabled={userInputMessage.trim().length === 0}
							>
								<Icon iconId="arrow-up" />
							</button>
						) : (
							conversation.isGenerating && (
								<button
									className="ow-btn submit"
									type="button"
									onClick={() => conversation.stopMessageGeneration()}
								>
									<Icon iconId="square" />
								</button>
							)
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
						<button
							className={`ow-btn pin-input ${
								isPinned ? "pinned" : ""
							}`}
							type="button"
							onClick={() => setIsPinned((prev) => !prev)}
						>
							<Icon iconId={"pin"} />
						</button>
					</div>
				</motion.div>
			</div>
		</div>
	);
};
