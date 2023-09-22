export type UserRole = 'system' | 'user' | 'assistant';
export type MessageStatus = 'finished_successfully' | 'error';
export type ContentType = 'text' | 'image' | 'video' | 'audio';

type AbsoluteTimestamp = 'absolute';
type RelativeTimestamp = 'now' | 'just now' | '1 minute ago' | '2 minutes ago' | '1 hour ago' | string;

type Timestamp = AbsoluteTimestamp | RelativeTimestamp;

export interface Author {
    role: UserRole;
    name: string | null;
    metadata: Record<string, unknown> | null;
}

export interface MessageContent {
    content_type: string;
    parts: string[];
}

export interface MessageMetadata {
    timestamp_?: Timestamp;
    message_type?: string | null;
    model_slug?: string;
    parent_id?: string;
    [key: string]: unknown;
}

export interface Message {
    id: string;
    author: Author;
    create_time: number | null;
    update_time: number | null;
    content: MessageContent;
    status: MessageStatus;
    end_turn: boolean | null;
    weight: number;
    metadata: MessageMetadata;
    recipient: 'all';
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
    mapping: { [id: string]: ConversationNode };
    moderation_results: Record<string, unknown>[];
    current_node: string | null;
    plugin_ids: string[] | null;
    conversation_id: string;
    conversation_template_id: string | null;
    id: string;
}
