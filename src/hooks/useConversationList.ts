import { getAllConversations } from "helpers/ConversationIOController";
import { IConversation } from "interfaces/IConversation";
import { FileSystemAdapter } from "obsidian";
import { usePlugin } from "providers/plugin/usePlugin";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseConversationListReturn {
	conversations: IConversation[];
	loading: boolean;
	error: Error | null;
}

export const useConversationList = (): UseConversationListReturn => {
	const plugin = usePlugin();

	const adapter = useMemo<FileSystemAdapter>(() => {
		return plugin.app.vault.adapter as FileSystemAdapter;
	}, [plugin.app.vault]);

	const [conversations, setConversations] = useState<IConversation[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<Error | null>(null);

	const fetchConversations = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const fetchedConversations = await getAllConversations(adapter, plugin.settings.weaverDirectory);
			setConversations(fetchedConversations);
		} catch (err) {
			setError(err as Error);
		} finally {
			setLoading(false);
		}
	}, [adapter, plugin.settings.weaverDirectory]);

	useEffect(() => {
		fetchConversations();
	}, [fetchConversations]);

	return {
		conversations,
		loading,
		error
	};
};
