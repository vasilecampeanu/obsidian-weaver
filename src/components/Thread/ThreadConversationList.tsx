import React, { useMemo, useRef, useState } from "react";
import { VariableSizeList as List } from "react-window";
import { IConversation } from "interfaces/IThread";
import Weaver from "main";
import useResizeObserver from "use-resize-observer";
import { groupBy } from "lodash";
import { ThreadListItemRenderer } from './ThreadListItemRenderer';
import { filterConversations, getSection, getItemSize } from '../../helpers/ThreadHelperFunctions';

interface ThreadConversationListProps {
	plugin: Weaver;
	conversations: IConversation[];
	onConversationDeleted: (id: string) => void;
	searchTerm: string;
	onTabSwitch: (tabId: string) => void;
	onConversationLoad: (conversation: IConversation) => void;
}

export const ThreadConversationList: React.FC<ThreadConversationListProps> = ({
	plugin,
	conversations,
	onConversationDeleted,
	searchTerm,
	onTabSwitch,
	onConversationLoad
}) => {
	const { ref, height: containerHeight } = useResizeObserver<HTMLDivElement>();
	const listRef = useRef<List>(null);

	const [expandedSections, setExpandedSections] = useState<string[]>([
		"Today",
		"Yesterday",
		"Older",
		"Previous 7 Days"
	]);

	const sortedConversations = useMemo(
		() =>
			[...conversations].sort((a, b) => {
				const dateA = new Date(a.lastModified);
				const dateB = new Date(b.lastModified);
				return dateB.getTime() - dateA.getTime();
			}),
		[conversations]
	);

	const groupedConversations = useMemo(
		() => groupBy(sortedConversations, (conversation) => getSection(conversation.lastModified)),
		[sortedConversations]
	);

	const conversationData = useMemo(() => {
		const data: any[] = [];

		Object.entries(groupedConversations).forEach(([section, sectionConversations]) => {
			data.push({ isSectionHeader: true, section });
			if (expandedSections.includes(section)) {
				data.push(...sectionConversations);
			}
		});

		return data;
	}, [groupedConversations, expandedSections]);

	const handleSectionHeaderClick = (section: string) => {
		setExpandedSections((current) =>
			current.includes(section) ? current.filter((s) => s !== section) : [...current, section]
		);

		listRef.current?.resetAfterIndex(0);
	};

	const handleConversationDeleted = (id: string) => {
		onConversationDeleted(id);
		listRef.current?.resetAfterIndex(0);
	};

	return (
		<div ref={ref} className="ow-thread-list" style={{ height: "100%" }}>
			{conversationData.length === 0 ? (
				<div className="ow-info">No conversations to display.</div>
			) : (
				<List
					ref={listRef}
					key={searchTerm}
					height={containerHeight || 0}
					itemCount={conversationData.length}
					itemSize={index => getItemSize(conversationData[index])}
					width="100%"
				>
					{({ index, style }) => {
						const item = conversationData[index];
						if (item.isSectionHeader) {
							return (
								<div
									className="ow-list-section"
									style={style}
									onClick={() => handleSectionHeaderClick(item.section)}
								>
									<div className="ow-list-section-title">
										{
											expandedSections.includes(item.section) ? (
												<button>
													<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
												</button>
											) : (
												<button>
													<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>
												</button>
											)
										}
										<span>{item.section}</span>
									</div>
								</div>
							);
						} else {
							return (
								<ThreadListItemRenderer
									index={index}
									style={style}
									item={item}
									plugin={plugin}
									onConversationDeleted={handleConversationDeleted}
									onTabSwitch={onTabSwitch}
									onConversationLoad={onConversationLoad}
								/>
							);
						}
					}}
				</List>
			)}
		</div>
	);
};
