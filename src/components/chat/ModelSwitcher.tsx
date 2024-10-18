import { EChatModels } from "enums/EProviders";
import { AnimatePresence, motion } from "framer-motion";
import React, { ReactElement, useEffect, useRef, useState } from "react";

interface ModelSwitcherProps {
	currentModel?: EChatModels;
	onSelect: (model: EChatModels) => void;
	children: ReactElement; // Accepts a single React element as the trigger
}

const modelDescriptions: Record<EChatModels, string> = {
	[EChatModels.GPT_4]: "Legacy model",
	[EChatModels.GPT_4o]: "Great for most tasks",
	[EChatModels.GPT_4o_mini]: "Faster at reasoning",
};

export const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
	currentModel,
	onSelect,
	children,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Toggle dropdown open state
	const toggleDropdown = () => setIsOpen((prev) => !prev);

	// Close switcher when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

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

	const displayModel = currentModel
		? currentModel.toUpperCase()
		: "SELECT MODEL";

	// Clone the child element to attach the toggle function and accessibility props
	const trigger = React.cloneElement(children, {
		onClick: toggleDropdown,
		"aria-haspopup": "listbox",
		"aria-expanded": isOpen,
		disabled: !currentModel,
	});

	return (
		<div className="ow-model-switcher" ref={dropdownRef}>
			{trigger}
			<AnimatePresence>
				{isOpen && (
					<motion.ul
						className="ow-model-switcher-menu"
						initial="closed"
						animate="open"
						exit="closed"
						variants={dropdownVariants}
						role="listbox"
					>
						<li
							className="ow-model-switcher-header"
							aria-disabled="true"
						>
							Switch model
						</li>
						{Object.values(EChatModels).map((model) => (
							<li
								key={model}
								className={`ow-model-switcher-item ${
									model === currentModel ? "selected" : ""
								}`}
								onClick={() => {
									onSelect(model);
									setIsOpen(false);
								}}
								role="option"
								aria-selected={model === currentModel}
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
					</motion.ul>
				)}
			</AnimatePresence>
		</div>
	);
};
