import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { xonokai } from 'react-syntax-highlighter/dist/esm/styles/prism';

const convertTheme = (theme: any): { [key: string]: React.CSSProperties } => {
	const convertedTheme: { [key: string]: React.CSSProperties } = {};
	for (const key in theme) {
		if (Object.prototype.hasOwnProperty.call(theme, key)) {
			const value = theme[key];
			if (typeof value === 'object' && !Array.isArray(value)) {
				convertedTheme[key] = value as React.CSSProperties;
			}
		}
	}
	return convertedTheme;
};

const compatibleDarkTheme = convertTheme(xonokai);

export interface MessageBubbleProps {
	role: string;
	timestamp: string;
	content: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
	role,
	timestamp,
	content,
}) => {
	return (
		<div
			className={`message-bubble ${role === 'user' ? 'message-user' : 'message-assistant'
				}`}
		>
			<div className="message-content paragraph-container">
				<ReactMarkdown
					children={content}
					components={{
						code({ node, inline, className, children, ...props }) {
							const match = /language-(\w+)/.exec(className || '');
							return !inline && match ? (
								<div className="code-block-container">
									<SyntaxHighlighter
										children={String(children).replace(/\n$/, '')}
										style={compatibleDarkTheme as any}
										className="code-block"
										language={match[1]}
										PreTag="div"
										{...props}
									/>
								</div>
							) : (
								<code className={className} {...props}>
									{children}
								</code>
							);
						},
					}}
				/>
			</div>
		</div>
	);
};
