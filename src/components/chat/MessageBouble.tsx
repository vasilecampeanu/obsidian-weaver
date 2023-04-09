import React, { useEffect, useRef } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { MarkdownRenderer } from 'obsidian';

export interface MessageBubbleProps {
	role: string;
	timestamp: string;
	content: string;
	isLoading?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
	role,
	timestamp,
	content,
	isLoading,
}) => {
	const messageContentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (messageContentRef.current) {
			const context = {
				cache: {},
				async onload(ctx: any) {
					return ctx;
				},
				async onunload() {},
			};

			MarkdownRenderer.renderMarkdown(
				content,
				messageContentRef.current,
				'',
				context as any
			);
		}
	}, [content]);

	const copyTextWithoutMarkdown = async () => {
		const plainText = messageContentRef.current?.textContent || '';
		await navigator.clipboard.writeText(plainText);
	};

	const bubbleClass = `message-bubble ${role === 'user' ? 'message-user' : 'message-assistant'}`;

	return (
		<div className={bubbleClass}>
			<div className="message-content paragraph-container" ref={messageContentRef}>
				{isLoading ? (
					<ThreeDots
						height="5"
						width="30"
						radius="1.5"
						ariaLabel="three-dots-loading"
						wrapperClass="three-dots-leader"
						visible={true}
					/>
				) : null}
			</div>
			<button className="copy-button" onClick={copyTextWithoutMarkdown}>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
			</button>
		</div>
	);
};

