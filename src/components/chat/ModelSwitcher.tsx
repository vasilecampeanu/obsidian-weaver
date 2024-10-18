import { Icon } from "components/primitives/Icon";
import { EChatModels } from "enums/EProviders";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface ModelDropdownProps {
	currentModel?: EChatModels;
	onSelect: (model: EChatModels) => void;
}

const modelDescriptions: Record<EChatModels, string> = {
	[EChatModels.GPT_4]: "Legacy model",
	[EChatModels.GPT_4o]: "Great for most tasks",
	[EChatModels.GPT_4o_mini]: "Faster at reasoning",
};

export const ModelSwitcher: React.FC<ModelDropdownProps> = ({
	currentModel,
	onSelect,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

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

	return (
		<div className="ow-model-switcher" ref={dropdownRef}>
			<button
				className="ow-model-info-select"
				onClick={() => setIsOpen((prev) => !prev)}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				disabled={!currentModel}
			>
				<span className="icon">
					<Icon iconId={"sparkles"} />
				</span>
				<span className="model-name">{displayModel}</span>
				<span className="icon">
					<Icon iconId={"chevron-down"} />
				</span>
			</button>
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
