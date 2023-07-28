import { IConversation } from "interfaces/IThread";
import Weaver from "main";

const sectionHeaderHeight = 25;
const itemHeight = 50;
const compactItemHeight = 40;

export const filterConversations = (
	conversations: IConversation[],
	searchTerm: string,
	searchField: "title" | "messages" = "title"
) => {
	if (!searchTerm) return conversations;

	return conversations.filter((conversation) => {
		if (searchField === "title") {
			return conversation.title.toLowerCase().includes(searchTerm.toLowerCase());
		} else if (searchField === "messages") {
			return conversation.messages.some((message) =>
				(message.content as unknown as string).toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		return false;
	});
};

export const getSection = (creationDate: string) => {
	const date = new Date(creationDate);
	const now = new Date();
	const diffInDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

	if (diffInDays === 0) return "Today";
	if (diffInDays === 1) return "Yesterday";
	if (diffInDays > 1 && diffInDays <= 7) return "Previous 7 Days";

	return "Older";
};

export const getItemSize = (plugin: Weaver, item: { isSectionHeader: boolean }) => (item.isSectionHeader ? sectionHeaderHeight : plugin.settings.threadViewCompactMode === true ? compactItemHeight : itemHeight);
