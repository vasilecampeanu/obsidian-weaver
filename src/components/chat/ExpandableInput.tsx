import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { TokenEncoder } from 'utils/TokenEncoder';
import Weaver from 'main';

interface ExpandableInputProps {
	plugin: Weaver,
	leftDivWidth: number,
	heightControls: any,
	setShowContextFinder: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ExpandableInput: React.FC<ExpandableInputProps> = ({plugin, leftDivWidth, heightControls, setShowContextFinder }) => {
	const [showCount, setShowCount] = useState(false);
	const [charCount, setCharCount] = useState(0);
	const [tokenCount, setTokenCount] = useState(0);
	const [textValue, setTextValue] = useState('');
	const [isPinned, setIsPinned] = useState(false);

	const borderRadiusControls = useAnimation();

	const isHovering = useRef(false);
	const isFocused = useRef(false);

	const encoder = useMemo(() => new TokenEncoder("gpt-3.5-turbo"), []);

	const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number): (...funcArgs: Parameters<T>) => void => {
		let timerId: NodeJS.Timeout | null = null;
		return (...args: Parameters<T>) => {
			if (timerId) {
				clearTimeout(timerId);
			}
			timerId = setTimeout(() => {
				fn(...args);
				timerId = null;
			}, delay);
		};
	};

	const debouncedTokenCalculation = useCallback(debounce(async (newText: string) => {
		const tokens = await encoder.getTokenCountForText(newText);
		setTokenCount(tokens);
	}, 300), []);

	const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		let newText = e.target.value;

		if (newText.length > 2000) {
			newText = newText.slice(0, 2000);
		}

		setTextValue(newText);
		setCharCount(newText.length);

		debouncedTokenCalculation(newText);
	};

	return (
		<motion.div
			initial={{ width: `calc(100% - 10px - ${leftDivWidth}px)`, borderRadius: "20px" }}
			animate={borderRadiusControls}
			whileHover={{ width: '100%' }}
			onHoverStart={() => {
				if (!isPinned) {
					isHovering.current = true;
					borderRadiusControls.start({ borderRadius: "10px" });
					heightControls.start({ height: "150px" });
				}
			}}
			onHoverEnd={() => {
				isHovering.current = false;

				if (textValue.length > 0) return;

				if (!isFocused.current && !isPinned) {
					borderRadiusControls.start({ borderRadius: "20px" });
					heightControls.start({ height: "auto" });
					setShowCount(false);
				}
			}}
			onAnimationComplete={() => {
				if (isHovering.current) {
					setShowCount(true);
				}
			}}
			transition={{ duration: 0.3 }}
			className="ow-expandable-input"
		>
			<div className="ow-expandable-input-inner-wrapper">
				<div className="ow-textarea-wrapper">
					<div className="ow-textarea-inner-wrapper">
						<textarea
							placeholder="Ask me anything..."
							value={textValue}
							onChange={handleTextChange}
							onFocus={() => {
								isFocused.current = true;
							}}
							onBlur={() => {
								isFocused.current = false;

								if (textValue.length > 0) return;

								if (!isHovering.current && !isPinned) {
									borderRadiusControls.start({ borderRadius: "20px" });
									heightControls.start({ height: "auto" });
									setShowCount(false);
								}
							}}
						/>
						<div className="ow-user-actions">
							<button
								className="ow-add-note-as-context-btn"
								onClick={() => setShowContextFinder(prevState => !prevState)}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="12" x2="12" y1="18" y2="12" /><line x1="9" x2="15" y1="15" y2="15" /></svg>
							</button>
							{charCount === 0 ? (
								<></>
							) : (
								<button
									className="ow-submit"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
								</button>
							)}
						</div>
					</div>
					{showCount && (
						<motion.div
							className="ow-chracters-count"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<div className="ow-count">
								<span className="ow-chat-count">{charCount}/2000</span>
								<span className="ow-token-count">{tokenCount}</span>
							</div>
							<div className="ow-pin-input-btn">
								<button
									className={`ow-pin-input-btn ${isPinned ? 'pinned' : ''}`}
									onClick={() => {
										setIsPinned(!isPinned);
										if (!isPinned) {
											heightControls.start({ height: "300px" });
										} else {
											heightControls.start({ height: "150px" });
										}
									}}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin"><line x1="12" x2="12" y1="17" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
								</button>
							</div>
						</motion.div>
					)}
				</div>
			</div>
		</motion.div>
	);
};
