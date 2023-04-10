import React, { useEffect, useRef } from 'react';
import { ThreeDots } from 'react-loader-spinner';
import { MarkdownRenderer } from 'obsidian';
import TurndownService from 'turndown';

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
		const html = messageContentRef.current?.innerHTML || '';
		const turndownService = new TurndownService();

		turndownService.addRule('tables', {
			filter: 'table',
			replacement: function (content, node) {
				const thead = node.querySelector('thead');
				const tbody = node.querySelector('tbody');
				const headerRows = thead ? Array.from(thead.rows) : [];
				const bodyRows = tbody ? Array.from(tbody.rows) : [];

				const table = headerRows.concat(bodyRows);

				const tableMarkdown = table
					.map((row, rowIndex) => {
						const rowContent = (
							'|' +
							Array.from(row.cells)
								.map((cell) => (cell.textContent ? cell.textContent.trim() : ''))
								.join('|') +
							'|'
						);

						if (rowIndex === 0 && headerRows.length > 0) {
							const separatorRow = '|' + Array.from(row.cells)
								.map((cell) => '---')
								.join('|') + '|';

							return rowContent + '\n' + separatorRow;
						}

						return rowContent;
					}).join('\n');

				return '\n\n' + tableMarkdown + '\n\n';
			},
		});

		turndownService.addRule('codeblocks', {
			filter: ['pre', 'code'],
			replacement: function (content, node) {
				if (node.nodeName === 'PRE' && node.firstElementChild?.nodeName === 'CODE') {
					const codeContent = node.firstElementChild.textContent || '';
					return '\n\n```\n' + codeContent + '\n```\n\n';
				} else if (node.nodeName === 'CODE') {
					return '`' + content + '`';
				} else {
					return content;
				}
			},
		});

		turndownService.addRule('mathblocks', {
			filter: (node) => node.nodeName === 'MJX-CONTAINER',
			replacement: function (content, node) {
			  const originalMathMLNode = node.querySelector('mjx-assistive-mml');
		  
			  if (!originalMathMLNode) {
				return '';
			  }
		  
			  const originalTeX = originalMathMLNode.getAttribute('data-mjx-texinput');
			  const displayMode = node.nodeType === Node.ELEMENT_NODE && (node as Element).getAttribute('display') === 'true';
		  
			  // Use double dollar signs for display mode and single dollar signs for inline mode
			  const delimiter = displayMode ? '$$' : '$';
		  
			  return delimiter + (originalTeX || '') + delimiter;
			},
		  });

		const markdown = turndownService.turndown(html);
		await navigator.clipboard.writeText(markdown);
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
				<div className="ow-actions">
					<button className="ow-copy-button" onClick={copyTextWithMarkdown}>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
					</button>
				</div>
			</div>
		</div>
	);
};

