import { IconName, setIcon } from "obsidian";
import React, { useEffect, useRef } from "react";

interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
	iconId: IconName;
}

export const Icon: React.FC<IconProps> = ({ iconId, ...props }) => {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (ref.current) {
			setIcon(ref.current, iconId);
		}
	}, [iconId]);

	return <div ref={ref} {...props} />;
};
