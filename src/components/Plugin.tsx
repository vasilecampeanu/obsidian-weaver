import { useApp } from "./useApp";

export const Plugin = () => {
	const { vault } = useApp()!;
	return <h4>{vault.getName()}</h4>;
};
