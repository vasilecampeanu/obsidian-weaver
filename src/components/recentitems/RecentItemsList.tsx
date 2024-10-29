import { Icon } from "components/primitives/Icon";
import { TFile } from "obsidian";
import { usePlugin } from "providers/plugin/usePlugin";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { RecentFileItem, RecentItem } from "services/RecentItemsManager";

export const RecentItemsList: React.FC = () => {
	const plugin = usePlugin();

	const [recentItems, setRecentItems] = useState(
		plugin.recentItemsManager.recentItems
	);
	const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
	const [shouldScroll, setShouldScroll] = useState<boolean>(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const onUpdate = () => {
			setRecentItems([...plugin.recentItemsManager.recentItems]);
		};

		plugin.recentItemsManager.on("recent-items-updated", onUpdate);

		return () => {
			plugin.recentItemsManager.off("recent-items-updated", onUpdate);
		};
	}, [plugin]);

	const handleItemClick = (item: RecentItem) => {
		switch (item.type) {
			case "file":
				handleFileClick(item as RecentFileItem);
				break;
			default:
				console.warn(`Unhandled item type: ${item.type}`);
				break;
		}
	};

	const handleFileClick = (item: RecentFileItem) => {
		const file = plugin.app.vault.getAbstractFileByPath(item.path);

		if (file instanceof TFile) {
			plugin.app.workspace.getLeaf(false).openFile(file);
		} else {
			plugin.recentItemsManager.recentItems =
				plugin.recentItemsManager.recentItems.filter(
					(f) =>
						!(
							f.type === "file" &&
							(f as RecentFileItem).path === item.path
						)
				);
			setRecentItems([...plugin.recentItemsManager.recentItems]);
			plugin.recentItemsManager.save();
		}
	};

	useLayoutEffect(() => {
		if (containerRef.current && itemRefs.current.length > 0) {
			const itemsToMeasure = itemRefs.current.slice(0, 10);

			let totalHeight = 0;

			itemsToMeasure.forEach((item) => {
				if (item) {
					totalHeight += item.offsetHeight + 5;
				}
			});

			setMaxHeight(totalHeight - 1);
			setShouldScroll(recentItems.length > 5);
		}
	}, [recentItems]);

	return (
		<div className="ow-recent-items-list">
			<div className="ow-recent-items-list-title">
				<Icon iconId="history" />
				<span>Recent Items</span>
			</div>
			<div
				className="ow-recent-items-list-container-wrapper"
				ref={containerRef}
				style={{
					maxHeight: shouldScroll ? `${maxHeight}px` : "auto",
					overflowY: shouldScroll ? "auto" : "visible",
				}}
			>
				<div className="ow-recent-items-list-container">
					{recentItems.map((item, index) => (
						<div
							key={`${item.type}-${index}-${item.timestamp}`}
							className="ow-recent-item"
							onClick={() => handleItemClick(item)}
							ref={(el) => (itemRefs.current[index] = el)}
						>
							{renderItemContent(item)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

const renderItemContent = (item: RecentItem) => {
	switch (item.type) {
		case "file":
			const fileItem = item as RecentFileItem;
			return (
				<div className="ow-recent-file-item">
					{fileItem.extension === 'md' && (
						<Icon iconId="file-text" />
					)}
					{fileItem.extension === 'canvas' && (
						<Icon iconId="layout-dashboard" />
					)}
					{(fileItem.extension === 'png' || fileItem.extension === 'jpg' || fileItem.extension === 'webp') && (
						<Icon iconId="file-image" />
					)}
					<span>{fileItem.basename}</span>
				</div>
			);
		default:
			return (
				<div className="ow-recent-unknown-item">
					<Icon iconId="question" />
					<span>Unknown Item</span>
				</div>
			);
	}
};
