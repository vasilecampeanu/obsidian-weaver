import {
	autoUpdate,
	flip,
	FloatingFocusManager,
	offset,
	shift,
	useFloating,
} from "@floating-ui/react";
import React, { useEffect } from "react";

interface PopoverProps {
	referenceElement: React.RefObject<HTMLElement>;
	boundaryElement: React.RefObject<HTMLElement>;
	content: React.ReactNode;
	isOpen: boolean;
	onClose: () => void;
}

export const Popover: React.FC<PopoverProps> = ({
	referenceElement,
	boundaryElement,
	content,
	isOpen,
	onClose,
}) => {
	const { refs, floatingStyles, context } = useFloating({
		whileElementsMounted: autoUpdate,
		placement: "top-start",
		middleware: [
			offset(0),
			flip({
				fallbackPlacements: ["bottom-start"],
				boundary: boundaryElement.current || undefined,
			}),
			shift({
				boundary: boundaryElement.current || undefined,
			}),
		],
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
	}, [isOpen, refs, onClose]);
	

	if (!isOpen) return null;

	return (
		<FloatingFocusManager context={context} modal={false}>
			<div
				ref={refs.setFloating}
				style={floatingStyles}
				className="popover-content"
			>
				{content}
			</div>
		</FloatingFocusManager>
	);
};
