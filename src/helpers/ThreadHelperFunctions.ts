import { IConversation } from "interfaces/IThread";

const sectionHeaderHeight = 25;
const itemHeight = 50;

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
				message.content.toLowerCase().includes(searchTerm.toLowerCase())
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

export const getItemSize = (item: any) => (item.isSectionHeader ? sectionHeaderHeight : itemHeight);
