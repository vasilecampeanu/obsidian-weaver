import { IChatMessage } from 'interfaces/IThread';
import Weaver from 'main';
import { Component, MarkdownRenderer } from 'obsidian';
import React, { useEffect, useRef, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';

interface ConversationMessageBubbleProps {
	plugin: Weaver;
	message: IChatMessage;
	previousMessage: IChatMessage | undefined;
	selectedChild: number;
	onSelectedChildChange: (increment: number) => void;
	contextDisplay?: boolean;
}

export const ConversationMessageBubble: React.FC<ConversationMessageBubbleProps> = ({
	plugin,
	message,
	previousMessage,
	selectedChild,
	onSelectedChildChange,
	contextDisplay
}) => {
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [htmlDescriptionContent, setHtmlDescriptionContent] = useState<{ __html: string } | null>(null);

	const contextClass = contextDisplay === true ? "ow-remove-context" : "";

	useEffect(() => {
		const contentWrapper = document.createElement('div');
		const context = new Component();

		MarkdownRenderer.renderMarkdown(
			message.content,
			contentWrapper,
			'',
			context
		).then(() => {
			context.unload();
		});

		setHtmlDescriptionContent({ __html: contentWrapper.innerHTML });
	}, [message.content]);

	const copyTextWithMarkdown = async () => {
		await navigator.clipboard.writeText(message.content);

		setShowConfirmation(true);

		setTimeout(() => {
			setShowConfirmation(false);
		}, 1000);
	};

	return (
		<div className={`ow-message-bubble ${message.role === 'user' ? 'ow-user-bubble' : 'ow-assistant-bubble'} ${previousMessage?.children && previousMessage?.children.length > 1 ? 'ow-message-bubble-has-top-bar' : ''} ${contextClass}`} key={message.id}>
			<div className={`ow-message-bubble-content`}>
				{previousMessage?.children && previousMessage?.children.length > 1 && (
					<div className={`ow-message-bubble-top-bar ${message.isLoading === true ? "show" : ""}`}>
						<div className="ow-branch-selector">
							<button onClick={() => onSelectedChildChange(-1)}>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
							</button>
							<span>{selectedChild + 1}</span>
							<button onClick={() => onSelectedChildChange(1)}>
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
							</button>
						</div>
					</div>
				)}
				{message.isLoading ? (
					<div
						className="ow-content"
					>
						<ThreeDots
							height="5"
							width="30"
							radius="1.5"
							ariaLabel="three-dots-loading"
							wrapperClass="ow-three-dots-leader"
							visible={true}
						/>
					</div>
				) : (
					<div
						className="ow-content"
						dangerouslySetInnerHTML={htmlDescriptionContent || { __html: '' }}
					>
					</div>
				)}
			</div>
			<div className="ow-message-actions">
				<button className="ow-copy-button" onClick={copyTextWithMarkdown}>
					{showConfirmation ? (
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
					) : (
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
					)}
				</button>
			</div>
		</div>
	);
};
