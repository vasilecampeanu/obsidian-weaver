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

const TEXTAREA_LINE_HEIGHT = 14;

const buttonVariants = {
	hidden:  { opacity: 0 },
	visible: { opacity: 1 },
	exit:    { opacity: 0 },
};

interface ChatUserInputProps {}

export const ChatUserInput: React.FC<ChatUserInputProps> = () => {
	const [userInputMessage, setUserInputMessage] = useState<string>("");
	const [wordCount, setWordCount] = useState<number>(0);
	const [charCount, setCharCount] = useState<number>(0);
	const [isHovered, setIsHovered] = useState<boolean>(false);
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [isPinned, setIsPinned] = useState<boolean>(false);

	const [userSelection, setUserSelection] = useState<IUserSelection | null>(null);

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

	const submitMessage = async () => {
		try {
			// Do this early
			setUserInputMessage("");
			setWordCount(0);
			setCharCount(0);

			const selection = userSelection;
			setUserSelection(null);

			// Generate assistant response
			await conversation?.generateAssistantMessage(
				userInputMessage,
				selection
			);
		} catch (error) {
			console.error("Error sending message:", error);
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		await submitMessage();
	};

	const countWords = (text: string): number => {
		return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
	};

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		const value = event.target.value;

		setUserInputMessage(value);
		setCharCount(value.length);
		setWordCount(countWords(value));
	};

	const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
		const pasteData = event.clipboardData.getData("text");
		const currentValue = userInputMessage;
		const newValue = currentValue + pasteData;

		setUserInputMessage(newValue);
		setCharCount(newValue.length);
		setWordCount(countWords(newValue));

		event.preventDefault();
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

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submitMessage();
		}
	};

	const isExpanded = isHovered || isFocused || userInputMessage.length > 0 || isPinned;

	return (
		<div className="ow-chat-user-input">
			{userSelection && (
				<ChatSelectedTextModal
					userSelection={userSelection}
					setUserSelection={setUserSelection}
				/>
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
								onClick={() => conversation.initConversation(true)}
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
							className="ow-textarea"
							onFocus={handleFocus}
							onBlur={handleBlur}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
							onKeyDown={handleKeyDown}
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
						{userInputMessage.length > 0 && (plugin.settings.enableWordCounter || plugin.settings.enableCharacterCounter)? (
							<div className="ow-input-counters">
								{plugin.settings.enableWordCounter ? (
									<div className="ow-input-word-counter">
										{wordCount}
									</div>
								): null}
								{plugin.settings.enableCharacterCounter ? (
									<div className="ow-input-character-counter">
										{charCount}
									</div>
								) : null}
							</div>
						): null}
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
