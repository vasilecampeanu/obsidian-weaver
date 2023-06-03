import React, { useEffect, useMemo, useRef, useState } from "react";
import { List, CellMeasurer, CellMeasurerCache, AutoSizer } from "react-virtualized";
import { IConversation } from "interfaces/IThread";
import Weaver from "main";
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

	const listRef = useRef<HTMLDivElement>(null);  // Define type of ref

	useEffect(() => {
		const listElement = listRef.current;

		if (listElement) {
			listElement.addEventListener('mouseover', function () {
				document.body.classList.add('hide-tooltip');
			});

			listElement.addEventListener('mouseout', function () {
				document.body.classList.remove('hide-tooltip');
			});
		}

		return () => {
			if (listElement) {
				listElement.removeEventListener('mouseover', function () {
					document.body.classList.add('hide-tooltip');
				});

				listElement.removeEventListener('mouseout', function () {
					document.body.classList.remove('hide-tooltip');
				});
			}
		};
	}, []);

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
	};

	const handleConversationDeleted = (id: string) => {
		onConversationDeleted(id);
	};

	const cache = new CellMeasurerCache({
		defaultHeight: 50,
		fixedWidth: false,
	});

	const rowRenderer = ({ index, parent, key, style }: { index: number, parent: any, key: string, style: any }) => {
		const item = conversationData[index];

		return (
			<CellMeasurer
				cache={cache}
				columnIndex={0}
				key={key}
				rowIndex={index}
				parent={parent}
			>
				{({ measure }: { measure: () => void }) => {
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
									<span>
										{item.section}
									</span>
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
			</CellMeasurer>
		);
	};

	return (
		<div ref={listRef} className="ow-thread-list" style={{ height: "100%" }}>
			{conversationData.length === 0 ? (
				<div className="ow-info">No conversations to display.</div>
			) : (
				<AutoSizer>
					{({ height, width }) => (
						<List
							width={width}
							height={height}
							rowCount={conversationData.length}
							rowHeight={cache.rowHeight}
							rowRenderer={rowRenderer}
							overscanRowCount={10}
							className="HelloWorld"
						/>
					)}
				</AutoSizer>
			)}
		</div>
	);
};
