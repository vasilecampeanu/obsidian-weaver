import { IconName, setIcon } from "obsidian";
import React, { useEffect, useRef } from "react";

interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
    iconId: IconName;
}

export const Icon: React.FC<IconProps> = ({ iconId, className, ...props }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            setIcon(ref.current, iconId);
        }
    }, [iconId]);

    const combinedClassName = ['ow-icon', className].filter(Boolean).join(' ');

    return <div ref={ref} className={combinedClassName} {...props} />;
};
