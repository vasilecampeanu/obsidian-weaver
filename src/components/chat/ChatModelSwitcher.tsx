import { flip, offset, Placement, shift } from "@floating-ui/react";
import { Icon } from "components/primitives/Icon";
import { Popover } from "components/primitives/Popover";
import { EChatModels, modelDescriptions } from "enums/EProviders";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

interface ChatModelSwitcherProps {
	referenceElement: React.RefObject<HTMLElement>;
	placement?: Placement;
	boundaryRef?: React.RefObject<HTMLElement>;
	isChatModelSwitcherOpen: boolean;
	setIsChatModelSwitcherOpen: React.Dispatch<React.SetStateAction<boolean>>;
	currentModel?: EChatModels | undefined;
	onSelect: (model: EChatModels | undefined) => void;
}

export const ChatModelSwitcher: React.FC<ChatModelSwitcherProps> = ({
	referenceElement,
	placement,
	boundaryRef,
	isChatModelSwitcherOpen,
	setIsChatModelSwitcherOpen,
	currentModel,
	onSelect,
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

	useEffect(() => {
		if (isChatModelSwitcherOpen && boundaryRef?.current) {
			boundaryRef.current.style.overflow = "hidden";
		} else if (boundaryRef?.current) {
			boundaryRef.current.style.overflow = "auto";
		}
	}, [isChatModelSwitcherOpen, boundaryRef]);

	const renderContent = () => (
		<AnimatePresence>
			<motion.ul
				className="ow-model-switcher-menu"
				initial="closed"
				animate="open"
				exit="closed"
				variants={dropdownVariants}
				role="listbox"
			>
				<li className="ow-model-switcher-header" aria-disabled="true">
					Switch Model
				</li>
				<hr />
				{Object.values(EChatModels).map((model) => (
					<li
						key={model}
						className="ow-model-switcher-item"
						onClick={() => {
							onSelect(model);
							setIsChatModelSwitcherOpen(false);
						}}
						role="option"
					>
						<div className="model-item-content">
							<span className="model-name">
								{model.toUpperCase()}
							</span>
							<span className="model-description">
								{modelDescriptions[model]}
							</span>
						</div>
					</li>
				))}
				{currentModel ? (
					<>
						<hr />
						<li
							className="ow-model-switcher-item try-again-current"
							onClick={() => {
								onSelect(currentModel);
								setIsChatModelSwitcherOpen(false);
							}}
						>
							<div className="model-item-content">
								<span>Try again</span>
								<span className="model-name">
									{(currentModel || '').toUpperCase()}
								</span>
							</div>
							<div>
								<Icon iconId={"refresh-ccw"} />
							</div>
						</li>
					</>
				): null}
			</motion.ul>
		</AnimatePresence>
	);

	return (
		<div className="ow-chat-model-switcher">
			<Popover
				referenceElement={referenceElement}
				renderContent={renderContent}
				placement={placement || "top-start"}
				middleware={[
					offset(0),
					flip({
						fallbackPlacements: ["bottom-start"],
						boundary: boundaryRef?.current || undefined,
					}),
					shift({
						boundary: boundaryRef?.current || undefined,
					}),
				]}
				isOpen={isChatModelSwitcherOpen}
				onClose={() => setIsChatModelSwitcherOpen(false)}
			/>
		</div>
	);
};
