export interface IChatMessage {
	children: Array<string>;
	content: string;
	context: boolean,
	creationDate: string;
	id: string;
	isLoading?: boolean;
	model: string;
	role: string;
	parent: string;
}

export interface IConversation {
	currentNode: string;
	context: boolean,
	creationDate: string;
	id: string;
	identifier: string;
	lastModified: string;
	title: string;
	messages: Array<IChatMessage>;
}

export interface IThreadDescriptor {
	creationDate: string;
    description: string;
    id: string;
	identifier: string;
	lastModified: string;
    title: string;
}
