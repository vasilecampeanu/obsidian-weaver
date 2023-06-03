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
	mode: string;
}

export const ConversationMessageBubble: React.FC<ConversationMessageBubbleProps> = ({
	plugin,
	message,
	previousMessage,
	selectedChild,
	onSelectedChildChange,
	contextDisplay,
	mode
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
		message.role === 'info' ? (
			<div className={`ow-message-info-bubble ow-mode-${mode}`}>
				{((message && message.model) || plugin.settings.engine) === "gpt-3.5-turbo" ? (
					<>
						<div className="ow-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
						</div>
						<span>Using GPT-3.5</span>
					</>
				) : (
					<>
						<div className="ow-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
						</div>
						<span>Using GPT-4</span>
					</>
				)}
			</div>
		) : (
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
					<div
						className="ow-content"
						dangerouslySetInnerHTML={{ __html: `${htmlDescriptionContent?.__html}${message.isLoading && htmlDescriptionContent?.__html.length === 0 ? '<span class="ow-blinking-cursor"></span>' : ''}` }}
					/>
				</div>
				<div className="ow-message-actions">
					{message.role === 'user' ? (
						<>
							{/* 
								<button className="ow-edit-button">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
								</button> 
							*/}
						</>
					) : null}
					<button className="ow-copy-button" onClick={copyTextWithMarkdown}>
						{showConfirmation ? (
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
						)}
					</button>
				</div>
			</div>
		)
	)
};
