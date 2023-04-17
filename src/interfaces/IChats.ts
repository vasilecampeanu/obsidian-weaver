export interface IChatMessage {
	content: string;
	creationDate: string;
	isLoading?: boolean;
	role: string;
}

export interface IChatSession {
	color: string;
	context: true;
	creationDate: string;
	description: string;
	icon: string;
	id: number;
	identifier: string;
	lastModified: string;
	messages?: IChatMessage[];
	messagesCount: number;
	model: string;
	path: string;
	tags: string[];
	title: string;
	tokens: number;
}

export interface IChatThread {
    description: string;
    id: number;
    title: string;
    conversations: Array<IChatSession>;
}

export interface IDescriptor {
	identifier: string;
    version: string;
    threads: Array<IChatThread>;
}
