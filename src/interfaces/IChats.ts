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
    conversations: Array<IChatSession>;
    description: string;
    id: number;
    title: string;
}

export interface IDescriptor {
	identifier: string;
    version: string;
    threads: Array<IChatThread>;
}
