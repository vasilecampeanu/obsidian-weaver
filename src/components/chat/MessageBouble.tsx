import React from 'react';
import { ThreeDots } from 'react-loader-spinner';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { xonokai } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import ReactDOMServer from 'react-dom/server';

const compatibleDarkTheme = xonokai;

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

	const copyTextWithoutMarkdown = async (markdownContent: string) => {
		const htmlContent = <ReactMarkdown children={markdownContent} remarkPlugins={[remarkGfm]} />;
		const parser = new DOMParser();
		const parsedHtml = parser.parseFromString(
			ReactDOMServer.renderToStaticMarkup(htmlContent),
			'text/html'
		);
		const plainText = parsedHtml.body.textContent || '';
		await navigator.clipboard.writeText(plainText);
	};

	return (
		<div className={`message-bubble ${role === 'user' ? 'message-user' : 'message-assistant'}`}>
			<div className="message-content paragraph-container">
				{isLoading ? (
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
				)}
				<button
					className="copy-button"
					onClick={() => copyTextWithoutMarkdown(content)}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
				</button>
			</div>
		</div>
	)
}
