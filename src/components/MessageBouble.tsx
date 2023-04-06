import React from 'react';
import { ThreeDots } from 'react-loader-spinner';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { xonokai } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

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
	isLoading?: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
	role,
	timestamp,
	content,
	isLoading
}) => {
	return (
		<div
			className={`message-bubble ${role === 'user' ? 'message-user' : 'message-assistant'}`}
		>
			<div className="message-content paragraph-container">
				{
					isLoading == true ? (
						<ThreeDots
							height="5"
							width="30"
							radius="1.5"
							ariaLabel="three-dots-loading"
							wrapperClass="three-dots-leader"
							visible={true}
						/>
					) : (
						<ReactMarkdown
							children={content}
							remarkPlugins={[remarkGfm]}
							components={{
								code({ node, inline, className, children, ...props }) {
									const match = /language-(\w+)/.exec(className || '');
									const language = match ? match[1] : 'txt';

									return !inline ? (
										<div className="code-block-container">
											<SyntaxHighlighter
												children={String(children).replace(/\n$/, '')}
												style={compatibleDarkTheme as any}
												className="code-block"
												language={language}
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
					)
				}
			</div>
		</div>
	);
};
