import React, { useState } from 'react';

interface InputAreaProps {
	inputText: string;
	setInputText: (value: string) => void;
	onSubmit: (event: React.FormEvent) => void;
	isLoading: boolean;
	onCancelRequest: () => void;
	onNewChat: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
	inputText,
	setInputText,
	onSubmit,
	isLoading,
	onCancelRequest,
	onNewChat
}) => {
	const [isPinned, setIsPinned] = useState<Boolean>(false);

	const onPinInputBox = (event: React.FormEvent) => {
		event.preventDefault();
		setIsPinned(!isPinned);
	}

	const handleInputText = (event: any) => {
		if (inputText.length <= 2000) {
			setInputText(event.target.value);
		}
	}

	const handleKeyDown = (event: any) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			onSubmit(event);
		}
	};

	const handlePaste = (event: any) => {
		const pastedText = event.clipboardData.getData('text');
		if (inputText.length + pastedText.length > 2000) {
			event.preventDefault();
			return;
		}
	}

	return (
		<div className="input-area">
			<div className="tool-bar">
				{
					isLoading === true ? (
						<button
							onClick={onCancelRequest}
							className="btn-stop"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
							<span>STOP</span>
						</button>
					) : (
						<>
						</>
					)
				}
			</div>
			<form className="input-form" onSubmit={onSubmit}>
				<button
					className="btn-new-chat"
					type="button"
					onClick={() => {
						onNewChat();
						setIsPinned(false);
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
				</button>
				<div
					className={`chat-box ${isPinned ? 'pinned' : ''}`}
				>
					<div className="input">
						<textarea
							placeholder="Ask me anything..."
							value={inputText}
							onKeyDown={handleKeyDown}
							onChange={(event) => { handleInputText(event) }}
							onPaste={(event) => { handlePaste(event) }}
							disabled={isLoading}
						/>
						{inputText.length === 0 ? (
							<>
							</>
						) : (
							<button className="btn-submit" type="submit">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
							</button>
						)}
					</div>
					<div className="info-bar">
						<span>{inputText.length}/2000</span>
						<button
							className={`pin-chat-box ${isPinned ? 'pinned' : ''}`}
							onClick={onPinInputBox}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
						</button>
					</div>
				</div>
			</form>
		</div>
	);
};
