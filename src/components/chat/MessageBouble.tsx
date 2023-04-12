import React, { useEffect, useRef, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { MarkdownRenderer } from 'obsidian';

export interface MessageBubbleProps {
	role: string;
	creationDate: string;
	content: string;
	isLoading?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
	role,
	creationDate,
	content,
	isLoading,
}) => {
	const messageContentRef = useRef<HTMLDivElement>(null);
	const [showConfirmation, setShowConfirmation] = useState(false);
	
	useEffect(() => {
		if (messageContentRef.current) {
			const context = {
				cache: {},
				async onload(source: string, el: HTMLElement, ctx: any) {
					return ctx;
				},
				async onunload() { },
			};

			MarkdownRenderer.renderMarkdown(
				content,
				messageContentRef.current,
				'',
				context as any
			);
		}
	}, [content]);

	const copyTextWithMarkdown = async () => {
		await navigator.clipboard.writeText(content);

		setShowConfirmation(true);

		setTimeout(() => {
			setShowConfirmation(false);
		}, 1000);
	};

	return (
		<div className={`ow-message-bubble ${role === 'user' ? 'ow-user-bubble' : 'ow-assistant-bubble'}`}>
			<div className="ow-content-wrapper">
				<div className="ow-message-content paragraph-container" ref={messageContentRef}>
					{isLoading ? (
						<ThreeDots
							height="5"
							width="30"
							radius="1.5"
							ariaLabel="three-dots-loading"
							wrapperClass="ow-three-dots-leader"
							visible={true}
						/>
					) : null}
				</div>
			</div>
			<div className="ow-bubble-ow-actions">
				<div className="ow-bubble-ow-actions">
					<div className="ow-actions">
						<button className="ow-copy-button" onClick={copyTextWithMarkdown}>
							{showConfirmation ? (
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
							) : (
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

