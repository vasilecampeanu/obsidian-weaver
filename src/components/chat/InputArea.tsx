import React from 'react';

interface InputAreaProps {
	inputText: string;
	isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({
	inputText,
	isLoading,
}) => {
	return (
		<textarea
			placeholder="Ask me anything..."
			value={inputText}
			disabled={isLoading}
		/>
	);
};
