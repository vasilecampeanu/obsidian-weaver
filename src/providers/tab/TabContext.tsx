import React, { createContext, useContext, useState } from "react";

interface TabContextProps {
	currentTab: string;
	switchToChat: () => void;
	switchToConversationList: () => void;
}

const TabContext = createContext<TabContextProps | undefined>(undefined);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [currentTab, setCurrentTab] = useState("chat");

	const switchToChat = () => setCurrentTab("chat");
	const switchToConversationList = () => setCurrentTab("conversationList");

	return (
		<TabContext.Provider
			value={{ currentTab, switchToChat, switchToConversationList }}
		>
			{children}
		</TabContext.Provider>
	);
};

export const useTab = (): TabContextProps => {
	const context = useContext(TabContext);

	if (!context) {
		throw new Error("useTab must be used within a TabProvider");
	}

	return context;
};
