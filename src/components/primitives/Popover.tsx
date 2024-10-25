import {
	autoUpdate,
	FloatingFocusManager,
	Middleware,
	Placement,
	useFloating,
} from "@floating-ui/react";
import React, { useEffect } from "react";

interface PopoverProps {
	referenceElement: React.RefObject<HTMLElement>;
	renderContent: () => React.ReactNode;
	placement: Placement;
	middleware?: Array<Middleware | null | undefined | false>;
	isOpen: boolean;
	onClose: () => void;
}

export const Popover: React.FC<PopoverProps> = ({
	referenceElement,
	renderContent,
	placement,
	middleware,
	isOpen,
	onClose,
}) => {
	const { refs, floatingStyles, context } = useFloating({
		whileElementsMounted: autoUpdate,
		placement: placement,
		middleware: middleware,
	});

	useEffect(() => {
		if (referenceElement.current) {
			refs.setReference(referenceElement.current);
		}
	}, [referenceElement, refs]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				refs.floating.current &&
				!refs.floating.current.contains(event.target as Node) &&
				!referenceElement.current?.contains(event.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, refs, onClose, referenceElement]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		} else {
			document.removeEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<FloatingFocusManager context={context} modal={false}>
			<div
				ref={refs.setFloating}
				style={floatingStyles}
				className="popover-content"
			>
				{renderContent()}
			</div>
		</FloatingFocusManager>
	);
};
