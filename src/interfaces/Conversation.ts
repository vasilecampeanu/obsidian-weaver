export type UserRole = 'system' | 'user' | 'assistant';

export interface Author {
    role: UserRole;
    name: string | null;
    metadata: any;
}

export interface MessageContent {
    content_type: string;
    parts: string[];
}

export interface Message {
    id: string;
    author: Author;
    create_time: number | null;
    update_time: number | null;
    content: MessageContent;
    status: string;
    end_turn: boolean | null;
    weight: number;
    metadata: any;
    recipient: string;
}

export interface ConversationNode {
    id: string;
    message: Message | null;
    parent: string | null;
    children: string[];
}

export interface Conversation {
    title: string;
    create_time: number;
    update_time: number;
    mapping: { 
		[id: string]: ConversationNode 
	};
    moderation_results: any[];
    current_node: string | null;
    plugin_ids: any[] | null;
    conversation_id: string;
    conversation_template_id: string | null;
    id: string;
}
