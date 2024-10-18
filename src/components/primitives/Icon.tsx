import { IconName, setIcon } from "obsidian";
import React, { useEffect, useRef } from "react";

interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
	iconId?: IconName;
	svg?: React.ReactNode;
}

export const Icon: React.FC<IconProps> = ({
	iconId,
	svg,
	className,
	...props
}) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current && iconId && !svg) {
			setIcon(ref.current, iconId);
		}
	}, [iconId, svg]);

	const combinedClassName = ["ow-icon", className].filter(Boolean).join(" ");

	return (
		<div ref={ref} className={combinedClassName} {...props}>
			{svg ? svg : null}
		</div>
	);
};
