import { Placement } from "@floating-ui/react";
import { Icon } from "components/primitives/Icon";
import { Popover } from "components/primitives/Popover";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

interface ChatOptionsProps {
	referenceElement: React.RefObject<HTMLElement>;
	placement?: Placement;
	isChatOptionsOpen: boolean;
	setIsChatOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	onRename?: () => void;
	onDelete?: () => void;
}

export const ChatOptions: React.FC<ChatOptionsProps> = ({
	referenceElement,
	placement,
	isChatOptionsOpen,
	setIsChatOptionsOpen,
	onRename,
	onDelete,
}) => {
	const dropdownVariants = {
		open: {
			opacity: 1,
			y: 0,
			display: "block",
			transition: { duration: 0.2 },
		},
		closed: {
			opacity: 0,
			y: -10,
			transitionEnd: { display: "none" },
			transition: { duration: 0.2 },
		},
	};

	const handleOptionClick = (action: () => void) => {
		action();
		setIsChatOptionsOpen(false);
	};

	const renderContent = () => (
		<AnimatePresence>
			{isChatOptionsOpen && (
				<motion.ul
					className="ow-chat-options-menu"
					initial="closed"
					animate="open"
					exit="closed"
					variants={dropdownVariants}
					role="menu"
					aria-label="Chat Options"
				>
					<li className="ow-chat-options-header" aria-disabled="true">
						Chat Options
					</li>
					<hr />
					<li
						className="ow-chat-options-item"
						onClick={() => onRename && handleOptionClick(onRename)}
						role="menuitem"
						tabIndex={0}
					>
						<div className="option-item-content">
							<Icon iconId="edit" className="option-icon" />
							<span>Rename</span>
						</div>
					</li>
					<li
						className="ow-chat-options-item delete"
						onClick={() => onDelete && handleOptionClick(onDelete)}
						role="menuitem"
						tabIndex={0}
					>
						<div className="option-item-content">
							<Icon iconId="trash" className="option-icon" />
							<span>Delete</span>
						</div>
					</li> 
				</motion.ul>
			)}
		</AnimatePresence>
	);

	return (
		<div className="ow-chat-options">
			<Popover
				referenceElement={referenceElement}
				renderContent={renderContent}
				placement={placement || "bottom-start"}
				isOpen={isChatOptionsOpen}
				onClose={() => setIsChatOptionsOpen(false)}
			/>
		</div>
	);
};
