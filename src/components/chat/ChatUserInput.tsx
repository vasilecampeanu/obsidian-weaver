import { ConversationManager } from "api/ConversationManager";
import { OpenAIManager } from "api/OpenAIManager";
import { Icon } from "components/primitives/Icon";
import { usePlugin } from "components/providers/plugin/usePlugin";
import { AnimatePresence, motion } from "framer-motion";
import { IMessage, IMessageNode } from "interfaces/IChatDialogueFeed";
import { IUserSelection } from "interfaces/IChatInput";
import {
	ChangeEvent,
	ClipboardEvent,
	useEffect,
	useMemo,
	useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatSelectedTextModal } from "./ChatSelectedTextModal";

const MAX_CHARACTERS = 2000;

const buttonVariants = {
	hidden:  { opacity: 0 },
	visible: { opacity: 1 },
	exit:    { opacity: 0 }
};

interface ChatUserInputProps {}

export const ChatUserInput: React.FC<ChatUserInputProps> = () => {
	const [userInputMessage, setUserInputMessage] = useState<string>("");
	const [charCount, setCharCount] = useState<number>(0);
	const [isHovered, setIsHovered] = useState<boolean>(false);
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [userSelection, setUserSelection] = useState<IUserSelection>();
	const [conversationId, setConversationId] = useState<string | null>(null);

	const plugin = usePlugin();

	// Initialize ConversationManager and OpenAIManager
	const conversationManager = useMemo(() => {
		if (plugin) {
			return new ConversationManager(plugin.app);
		}
		return null;
	}, [plugin]);

	const openAIManager = useMemo(() => {
		if (plugin) {
			return OpenAIManager.getInstance(plugin.settings.apiKey);
		}
		return null;
	}, [plugin]);

	useEffect(() => {
		if (!plugin || !conversationManager) return;

		const handleSelectionChanged = (event: IUserSelection) => {
			setUserSelection(event);
		};

		plugin.events.on("selection-changed", handleSelectionChanged);

		// Initialize a new conversation
		const initConversation = async () => {
			const conversation = await conversationManager.createConversation(
				"New Conversation"
			);
			setConversationId(conversation.id);
		};
		initConversation();

		return () => {
			plugin.events.off("selection-changed", handleSelectionChanged);
		};
	}, [plugin, conversationManager]);

	// Determine if the input area should be expanded
	const isExpanded = isHovered || isFocused || userInputMessage.length > 0;

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!conversationManager || !openAIManager || !conversationId) {
			console.log("TODO: Error 1")
			// Handle error or prompt user to set up API key
			return;
		}
		
		const conversation = await conversationManager.getConversation(
			conversationId
		);
		
		if (!conversation) {
			// Handle error
			console.log("TODO: Error 2")
			return;
		}

		// Prepare the user's message
		const userMessageId = uuidv4();
		const currentTime = Date.now() / 1000;

		const userMessage: IMessage = {
			id: userMessageId,
			author: {
				role: "user",
				name: null,
				metadata: undefined
			},
			create_time: currentTime,
			update_time: currentTime,
			content: {
				content_type: "text",
				parts: [userInputMessage],
			},
			status: "finished_successfully",
			end_turn: true,
			weight: 1.0,
			metadata: {},
			recipient: "all",
			channel: null,
		};

		const userMessageNode: IMessageNode = {
			id: userMessageId,
			message: userMessage,
			parent: conversation.current_node,
			children: [],
		};

		// Add the user's message to the conversation
		await conversationManager.addMessageToConversation(
			conversationId,
			userMessageNode
		);

		// Get the conversation path to send to OpenAI
		const conversationPath = await conversationManager.getConversationPath(
			conversationId
		);

		// Prepare messages for OpenAI
		const messagesToSend = conversationPath
			.filter((node) => node.message !== null)
			.map((node) => node.message!);

		// Send messages to OpenAI and get the response
		const response = await openAIManager.sendMessage(
			messagesToSend,
			conversation.default_model_slug
		);

		const assistantReplyContent = response.choices[0]?.message?.content;

		if (assistantReplyContent) {
			// Prepare the assistant's message
			const assistantMessageId = uuidv4();
			const assistantMessage: IMessage = {
				id: assistantMessageId,
				author: {
					role: "assistant",
					name: null,
					metadata: undefined
				},
				create_time: Date.now() / 1000,
				update_time: Date.now() / 1000,
				content: {
					content_type: "text",
					parts: [assistantReplyContent],
				},
				status: "finished_successfully",
				end_turn: true,
				weight: 1.0,
				metadata: {},
				recipient: "all",
				channel: null,
			};

			const assistantMessageNode: IMessageNode = {
				id: assistantMessageId,
				message: assistantMessage,
				parent: userMessageId,
				children: [],
			};

			// Add the assistant's message to the conversation
			await conversationManager.addMessageToConversation(
				conversationId,
				assistantMessageNode
			);
		}

		// Clear the user input
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
			{userSelection && (
				<ChatSelectedTextModal userSelection={userSelection} />
			)}
			<div className="ow-chat-user-input-toolbar">
				<button className="ow-btn assistant-response-stop">
					<Icon iconId="circle-off" />
				</button>
				<button className="ow-btn assistant-response-regenerate">
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
								transition={{
									duration: 0.2,
									ease: "easeInOut",
								}}
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
