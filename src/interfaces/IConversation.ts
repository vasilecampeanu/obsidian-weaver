import { EChatModels } from "enums/EProviders";

// Interface representing the entire conversation
export interface IConversation {
	title: string;
	create_time: number;
	update_time: number;
	mapping: { [key: string]: IMessageNode };
	moderation_results: any[];
	current_node: string;
	plugin_ids: any;
	conversation_id: string;
	conversation_template_id: any;
	gizmo_id: any;
	is_archived: boolean;
	safe_urls: any[];
	default_model_slug: EChatModels;
	conversation_origin: any;
	voice: any;
	async_status: any;
	id: string;
}

// Interface for each node in the conversation mapping
export interface IMessageNode {
	id: string;
	message: IMessage | null;
	parent: string | null;
	children: string[];
}

// Interface representing a message
export interface IMessage {
	id: string;
	author: IAuthor;
	create_time: number | null;
	update_time: number | null;
	content: IContent;
	status: string;
	end_turn: boolean | null;
	weight: number;
	metadata: IMetadata;
	recipient: string;
	channel: string | null;
}

// Interface for the author of a message
export interface IAuthor {
	role: 'system' | 'user' | 'assistant';
	name: string | null;
	metadata: any;
}

// Interface for the content of a message
export interface IContent {
	content_type: 'text' | 'text-with-user-selection';
	parts: string[];
}

// Interface for metadata associated with a message
export interface IMetadata {
	is_visually_hidden_from_conversation?: boolean;
	is_user_system_message?: boolean;
	user_context_message_data?: {
		about_user_message: string;
		about_model_message: string;
	};
	serialization_metadata?: {
		custom_symbol_offsets: any[];
	};
	request_id?: string;
	message_source?: string | null;
	timestamp_?: string;
	message_type?: string | null;
	model_slug?: EChatModels;
	default_model_slug?: EChatModels;
	parent_id?: string;
	finish_details?: {
		type: string;
		stop_tokens: number[];
	};
	is_complete?: boolean;
	citations?: any[];
	content_references?: any[];
	gizmo_id?: string | null;
	snorkle_status?: number;
	rebase_system_message?: boolean;
	[key: string]: any; // To accommodate any additional fields
}
