import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ExpandableInput } from './ExpandableInput';
import Weaver from 'main';

interface InputWrapper {
	plugin: Weaver,
	setShowContextFinder: React.Dispatch<React.SetStateAction<boolean>>;
}

export const InputWrapper: React.FC<InputWrapper> = ({ plugin, setShowContextFinder }) => {
	const [leftDivWidth, setLeftDivWidth] = useState<number | null>(null);
	const leftDivRef = useRef<HTMLDivElement | null>(null);

	const heightControls = useAnimation();

	useEffect(() => {
		if (leftDivRef.current) {
			const timeoutId = setTimeout(() => {
				setLeftDivWidth(leftDivRef.current!.offsetWidth);
			}, 100);

			return () => clearTimeout(timeoutId);
		}
	}, [leftDivRef.current]);

	return (
		<motion.div
			initial={{ height: 'auto' }}
			animate={heightControls}
			transition={{ duration: 0.3 }}
			className="ow-input-wrapper"
		>
			<div ref={leftDivRef} className="ow-input-left">
				<button className="ow-new-chat">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
				</button>
			</div>
			{leftDivWidth !== null && <ExpandableInput plugin={plugin} leftDivWidth={leftDivWidth} heightControls={heightControls} setShowContextFinder={setShowContextFinder} />}
		</motion.div>
	);
};
