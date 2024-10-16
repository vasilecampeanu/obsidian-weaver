import { IMessageNode } from "interfaces/IConversation";
import { useMemo } from "react";

export const useLatestCreateTimeMap = (mapping: Record<string, IMessageNode>) => {
	const latestMap = useMemo(() => {
		const map: Record<string, number> = {};

		const computeLatest = (nodeId: string): number => {
			const node = mapping[nodeId];

			if (!node) return 0;

			if (map[nodeId]) return map[nodeId];

			let latest = node.message?.create_time ?? 0;

			node.children.forEach((childId) => {
				const childLatest = computeLatest(childId);

				if (childLatest > latest) {
					latest = childLatest;
				}
			});

			map[nodeId] = latest;

			return latest;
		};

		Object.keys(mapping).forEach((nodeId) => {
			computeLatest(nodeId);
		});

		return map;
	}, [mapping]);

	return latestMap;
};
