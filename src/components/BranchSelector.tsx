// BranchSelector.tsx
import React from 'react';

interface Props {
	currentIndex: number;
	totalBranches: number;
	onLeft: () => void;
	onRight: () => void;
}

const BranchSelector: React.FC<Props> = ({ currentIndex, totalBranches, onLeft, onRight }) => {
	return (
		<div>
			<button onClick={onLeft} disabled={currentIndex === 0}>Left</button>
			<span>{currentIndex + 1}/{totalBranches}</span>
			<button onClick={onRight} disabled={currentIndex === totalBranches - 1}>Right</button>
		</div>
	)
};

export default BranchSelector;
