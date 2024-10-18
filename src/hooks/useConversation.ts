import { OpenAIRequestManager } from 'api/providers/OpenAIRequestManager';
import { EChatModels } from 'enums/EProviders';
import { throttle } from 'helpers/Async';
import {
	createConversation,
	getConversation,
	writeConversation,
} from 'helpers/ConversationIOController';
import { IConversation, IMessageNode } from 'interfaces/IConversation';
import { FileSystemAdapter } from 'obsidian';
import { usePlugin } from 'providers/plugin/usePlugin';
import { useStore } from 'providers/store/useStore';
import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useConversation = () => {
	const plugin = usePlugin();

	const conversation = useStore((state) => state.conversation);
	const setConversation = useStore((state) => state.setConversation);

	const previousConversationId = useStore((state) => state.previousConversationId);
	const setPreviousConversationId = useStore((state) => state.setPreviousConversationId);

	const isGenerating = useStore((state) => state.isGenerating);
	const setIsGenerating = useStore((state) => state.setIsGenerating);

	const [abortController, setAbortController] = useState<AbortController | null>(null);

	const openAIManager = useMemo(
		() => new OpenAIRequestManager(plugin.settings.apiKey),
		[plugin.settings.apiKey]
	);

	const adapter = useMemo(() => plugin.app.vault.adapter as FileSystemAdapter, [plugin.app.vault]);

	const initConversation = async (title: string = 'Untitled') => {
		if (plugin.settings.loadLastConversation && previousConversationId) {
			try {
				await loadConversation(previousConversationId);
				return;
			} catch (error) {
				console.error(`Failed to load conversation with ID ${previousConversationId}:`, error);
			}
		}

		await createNewConversation(title);
	};

	// Create a new conversation and set it in the store
	const createNewConversation = useCallback(
		async (title: string = 'Untitled') => {
			const newConversation = await createConversation(adapter, plugin.settings.model, plugin.settings.weaverDirectory, title);
			setConversation(newConversation);
			setPreviousConversationId(newConversation.id);
			return newConversation;
		},
		[adapter, plugin.settings.weaverDirectory, setConversation, setPreviousConversationId]
	);

	// Save the conversation to the file system
	const saveConversation = useCallback(
		async (updatedConversation: IConversation) => {
			try {
				await writeConversation(adapter, plugin.settings.weaverDirectory, updatedConversation);
			} catch (error) {
				console.error('Failed to save conversation:', error);
			}
		},
		[adapter, plugin.settings.weaverDirectory]
	);

	// Update the conversation in the store and save it
	const updateConversation = useCallback(
		async (updatedConversation: IConversation) => {
			setConversation(updatedConversation);
			await saveConversation(updatedConversation);
		},
		[setConversation, saveConversation]
	);

	// Generate an assistant message based on a user message
	const generateAssistantMessage = useCallback(
		async (userMessage: string) => {
			if (!conversation) {
				throw new Error('No conversation initialized');
			}

			setIsGenerating(true);

			// Capture the current timestamp once for consistency
			const now = Date.now() / 1000;

			// Create user message node
			const userMessageNodeId = uuidv4();
			const userMessageNode: IMessageNode = {
				id: userMessageNodeId,
				message: {
					id: userMessageNodeId,
					author: { role: 'user', name: null, metadata: {} },
					create_time: now,
					update_time: now,
					content: {
						content_type: 'text',
						parts: [userMessage],
					},
					status: 'finished_successfully',
					end_turn: true,
					weight: 1.0,
					metadata: {},
					recipient: 'all',
					channel: null,
				},
				parent: conversation.current_node,
				children: [],
			};

			// Add user message node to conversation
			let updatedConversation: IConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[userMessageNodeId]: userMessageNode,
					...(conversation.current_node && {
						[conversation.current_node]: {
							...conversation.mapping[conversation.current_node],
							children: [
								...conversation.mapping[conversation.current_node].children,
								userMessageNodeId,
							],
						},
					}),
				},
				current_node: userMessageNodeId,
				update_time: now,
			};

			await updateConversation(updatedConversation);

			// Prepare conversation path up to user message
			const conversationPath = getConversationPathToNode(updatedConversation, userMessageNodeId)
				.filter((node) => node.message)
				.map((node) => node.message!);

			// Create assistant message node with updated metadata
			const assistantMessageNodeId = uuidv4();
			const assistantMessageNode: IMessageNode = {
				id: assistantMessageNodeId,
				message: {
					id: assistantMessageNodeId,
					author: {
						role: 'assistant', 
						name: null, 
						metadata: {}
					},
					create_time: now,
					update_time: now,
					content: {
						content_type: 'text',
						parts: [''],
					},
					status: 'in_progress',
					end_turn: false,
					weight: 1.0,
					metadata: {
						default_model_slug: updatedConversation.default_model_slug,
						model_slug: updatedConversation.default_model_slug,
					},
					recipient: 'all',
					channel: null,
				},
				parent: userMessageNodeId,
				children: [],
			};

			// Add assistant message node to conversation
			updatedConversation = {
				...updatedConversation,
				mapping: {
					...updatedConversation.mapping,
					[assistantMessageNodeId]: assistantMessageNode,
					[userMessageNodeId]: {
						...updatedConversation.mapping[userMessageNodeId],
						children: [...updatedConversation.mapping[userMessageNodeId].children, assistantMessageNodeId],
					},
				},
				current_node: assistantMessageNodeId,
				update_time: now,
			};

			await updateConversation(updatedConversation);

			// Initialize AbortController for streaming
			const controller = new AbortController();
			setAbortController(controller);

			// Stream assistant response
			await streamAssistantResponse(
				updatedConversation,
				assistantMessageNode,
				conversationPath,
				controller
			);
		},
		[conversation, setIsGenerating, setAbortController, openAIManager, updateConversation]
	);

	// Regenerate an assistant message based on a previous assistant message
	const regenerateAssistantMessage = useCallback(
		async (messageId: string) => {
			if (!conversation) {
				throw new Error('No conversation initialized');
			}

			setIsGenerating(true);

			// Capture the current timestamp once for consistency
			const now = Date.now() / 1000;

			// Retrieve the assistant message node to regenerate
			const assistantNodeToRegenerate = conversation.mapping[messageId];

			if (!assistantNodeToRegenerate || assistantNodeToRegenerate.message?.author.role !== 'assistant') {
				throw new Error('Provided messageId is not an assistant message');
			}

			const userMessageNodeId = assistantNodeToRegenerate.parent;

			if (!userMessageNodeId) {
				throw new Error('No parent user message node found for regeneration');
			}

			const userMessageNode = conversation.mapping[userMessageNodeId];

			if (!userMessageNode || userMessageNode.message?.author.role !== 'user') {
				throw new Error('Parent node is not a user message');
			}

			// Create a new assistant message node with updated metadata
			const assistantMessageNodeId = uuidv4();
			const assistantMessageNode: IMessageNode = {
				id: assistantMessageNodeId,
				message: {
					id: assistantMessageNodeId,
					author: {
						role: 'assistant', 
						name: null, 
						metadata: {}
					},
					create_time: now,
					update_time: now,
					content: {
						content_type: 'text',
						parts: [''],
					},
					status: 'in_progress',
					end_turn: false,
					weight: 1.0,
					metadata: {
						default_model_slug: conversation.default_model_slug,
						model_slug: conversation.default_model_slug
					},
					recipient: 'all',
					channel: null,
				},
				parent: userMessageNodeId,
				children: [],
			};

			// Add assistant message node to conversation
			let updatedConversation: IConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[assistantMessageNodeId]: assistantMessageNode,
					[userMessageNodeId]: {
						...conversation.mapping[userMessageNodeId],
						children: [...conversation.mapping[userMessageNodeId].children, assistantMessageNodeId],
					},
				},
				current_node: assistantMessageNodeId,
				update_time: now,
			};

			await updateConversation(updatedConversation);

			// Prepare conversation path up to user message node
			const conversationPath = getConversationPathToNode(updatedConversation, userMessageNodeId)
				.filter((node) => node.message)
				.map((node) => node.message!);

			// Initialize AbortController for streaming
			const controller = new AbortController();
			setAbortController(controller);

			// Stream assistant response
			await streamAssistantResponse(
				updatedConversation,
				assistantMessageNode,
				conversationPath,
				controller
			);
		},
		[conversation, setIsGenerating, setAbortController, openAIManager, updateConversation]
	);

	// Stream the assistant's response and handle updates
	const streamAssistantResponse = useCallback(
		async (
			conversation: IConversation,
			assistantMessageNode: IMessageNode,
			conversationPath: any[],
			controller: AbortController
		) => {
			let assistantContent = '';
			const assistantMessageNodeId = assistantMessageNode.id;

			// Capture the current timestamp once for consistency in throttled updates
			const throttledSetConversation = throttle((updatedContent: string) => {
				const now = Date.now() / 1000;

				const updatedAssistantNode: IMessageNode = {
					...assistantMessageNode,
					message: {
						...assistantMessageNode.message!,
						content: {
							...assistantMessageNode.message!.content,
							parts: [updatedContent],
						},
						update_time: now,
					},
				};

				const newConversation: IConversation = {
					...conversation,
					mapping: {
						...conversation.mapping,
						[assistantMessageNodeId]: updatedAssistantNode,
					},
					update_time: now,
				};

				setConversation(newConversation);
			}, 100);

			try {
				const responseStream = await openAIManager.sendMessageStream(
					conversationPath,
					conversation.default_model_slug,
					controller.signal
				);

				for await (const chunk of responseStream) {
					const delta = chunk.choices[0].delta.content || '';

					if (delta) {
						assistantContent += delta;
						throttledSetConversation(assistantContent);
					}
				}

				// Final update after stream ends
				const now = Date.now() / 1000;
				const finalAssistantNode: IMessageNode = {
					...assistantMessageNode,
					message: {
						...assistantMessageNode.message!,
						content: {
							...assistantMessageNode.message!.content,
							parts: [assistantContent],
						},
						status: 'finished_successfully',
						end_turn: true,
						update_time: now,
					},
				};

				const finalConversation: IConversation = {
					...conversation,
					mapping: {
						...conversation.mapping,
						[assistantMessageNodeId]: finalAssistantNode,
					},
					current_node: assistantMessageNodeId,
					update_time: now,
				};

				await updateConversation(finalConversation);
			} catch (error: any) {
				if (error.name === 'AbortError') {
					console.log('Message generation was aborted');

					// Save the conversation with partial assistant content
					const partialNow = Date.now() / 1000;
					const partialAssistantNode: IMessageNode = {
						...assistantMessageNode,
						message: {
							...assistantMessageNode.message!,
							content: {
								...assistantMessageNode.message!.content,
								parts: [assistantContent],
							},
							status: 'aborted',
							end_turn: false,
							update_time: partialNow,
						},
					};

					const partialConversation: IConversation = {
						...conversation,
						mapping: {
							...conversation.mapping,
							[assistantMessageNodeId]: partialAssistantNode,
						},
						current_node: assistantMessageNodeId,
						update_time: partialNow,
					};

					await updateConversation(partialConversation);
				} else {
					console.error('Error generating assistant message:', error);

					// Optionally, save the conversation even on other errors
					const errorNow = Date.now() / 1000;
					const errorAssistantNode: IMessageNode = {
						...assistantMessageNode,
						message: {
							...assistantMessageNode.message!,
							content: {
								...assistantMessageNode.message!.content,
								parts: [assistantContent || ''],
							},
							status: 'error',
							end_turn: false,
							update_time: errorNow,
						},
					};

					const errorConversation: IConversation = {
						...conversation,
						mapping: {
							...conversation.mapping,
							[assistantMessageNodeId]: errorAssistantNode,
						},
						current_node: assistantMessageNodeId,
						update_time: errorNow,
					};

					await updateConversation(errorConversation);
				}
			} finally {
				setIsGenerating(false);
				setAbortController(null);
			}
		},
		[openAIManager, setConversation, updateConversation, setIsGenerating, setAbortController]
	);

	// Retrieve the path from the root to a specific node
	const getConversationPathToNode = useCallback(
		(conversation: IConversation, nodeId: string): IMessageNode[] => {
			const path: IMessageNode[] = [];
			let currentNodeId = nodeId;

			while (currentNodeId) {
				const node = conversation.mapping[currentNodeId];
				if (!node) break;

				path.unshift(node);

				currentNodeId = node.parent!;
			}

			return path;
		},
		[]
	);

	// Load a conversation by its ID
	const loadConversation = useCallback(
		async (conversationId: string) => {
			const loadedConversation = await getConversation(adapter, plugin.settings.weaverDirectory, conversationId);

			if (!loadedConversation) {
				throw new Error(`Conversation with ID ${conversationId} not found`);
			}

			setConversation(loadedConversation);
			setPreviousConversationId(loadedConversation.id);
		},
		[adapter, plugin.settings.weaverDirectory, setConversation, setPreviousConversationId]
	);

	// Stop the ongoing message generation
	const stopMessageGeneration = useCallback(() => {
		if (abortController) {
			abortController.abort();
		}
	}, [abortController]);

	// Navigate to a specific node in the conversation
	const navigateToNode = useCallback(
		async (nodeId: string) => {
			if (!conversation) return;

			const now = Date.now() / 1000;

			const updatedNode = {
				...conversation.mapping[nodeId],
				message: {
					...conversation.mapping[nodeId].message!,
					update_time: now,
				},
			};

			const updatedConversation: IConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[nodeId]: updatedNode,
				},
				current_node: nodeId,
				update_time: now,
			};

			await updateConversation(updatedConversation);
		},
		[conversation, updateConversation]
	);

	// Edit a user message and generate a new assistant response
	const editUserMessage = useCallback(
		async (messageId: string, newContent: string) => {
			if (!conversation) {
				throw new Error('No conversation initialized');
			}

			setIsGenerating(true);

			const now = Date.now() / 1000;

			// Retrieve the original user message node
			const originalUserNode = conversation.mapping[messageId];
			if (!originalUserNode || originalUserNode.message?.author.role !== 'user') {
				throw new Error('Provided messageId is not a user message');
			}

			const parentNodeId = originalUserNode.parent;
			if (!parentNodeId) {
				throw new Error('No parent node found for the user message');
			}

			const parentNode = conversation.mapping[parentNodeId];
			if (!parentNode) {
				throw new Error('Parent node does not exist');
			}

			// Create a new user message node with the edited content
			const newUserMessageNodeId = uuidv4();
			const newUserMessageNode: IMessageNode = {
				id: newUserMessageNodeId,
				message: {
					id: newUserMessageNodeId,
					author: { role: 'user', name: null, metadata: {} },
					create_time: now,
					update_time: now,
					content: {
						content_type: 'text',
						parts: [newContent],
					},
					status: 'finished_successfully',
					end_turn: true,
					weight: 1.0,
					metadata: {},
					recipient: 'all',
					channel: null,
				},
				parent: parentNodeId,
				children: [],
			};

			// Update the conversation with the new user message node
			let updatedConversation: IConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[newUserMessageNodeId]: newUserMessageNode,
					[parentNodeId]: {
						...parentNode,
						children: [...parentNode.children, newUserMessageNodeId],
					},
				},
				current_node: newUserMessageNodeId,
				update_time: now,
			};

			await updateConversation(updatedConversation);

			// Prepare the conversation path up to the new user message
			const conversationPath = getConversationPathToNode(updatedConversation, newUserMessageNodeId)
				.filter((node) => node.message)
				.map((node) => node.message!);

			// Create a new assistant message node with updated metadata
			const assistantMessageNodeId = uuidv4();
			const assistantMessageNode: IMessageNode = {
				id: assistantMessageNodeId,
				message: {
					id: assistantMessageNodeId,
					author: {
						role: 'assistant', 
						name: null, 
						metadata: {}
					},
					create_time: now,
					update_time: now,
					content: {
						content_type: 'text',
						parts: [''],
					},
					status: 'in_progress',
					end_turn: false,
					weight: 1.0,
					metadata: {
						default_model_slug: updatedConversation.default_model_slug,
						model_slug: updatedConversation.default_model_slug,
					},
					recipient: 'all',
					channel: null,
				},
				parent: newUserMessageNodeId,
				children: [],
			};

			// Add the assistant message node to the conversation
			updatedConversation = {
				...updatedConversation,
				mapping: {
					...updatedConversation.mapping,
					[assistantMessageNodeId]: assistantMessageNode,
					[newUserMessageNodeId]: {
						...newUserMessageNode,
						children: [...newUserMessageNode.children, assistantMessageNodeId],
					},
				},
				current_node: assistantMessageNodeId,
				update_time: now,
			};

			await updateConversation(updatedConversation);

			// Initialize AbortController for streaming
			const controller = new AbortController();
			setAbortController(controller);

			// Stream assistant response
			await streamAssistantResponse(
				updatedConversation,
				assistantMessageNode,
				conversationPath,
				controller
			);
		},
		[conversation, setIsGenerating, setAbortController, openAIManager, updateConversation]
	);

	// Update the conversation title
	const updateConversationTitle = useCallback(
		async (newTitle: string) => {
			if (!conversation) return;

			const now = Date.now() / 1000;
			const updatedConversation: IConversation = {
				...conversation,
				title: newTitle,
				update_time: now,
			};

			await updateConversation(updatedConversation);
		},
		[conversation, updateConversation]
	);

	// Update the conversation default model slug 
	const updateConversationModel = useCallback(
		async (model: EChatModels) => {
			if (!conversation) return;

			const now = Date.now() / 1000;
			const updatedConversation: IConversation = {
				...conversation,
				default_model_slug: model,
				update_time: now,
			};

			await updateConversation(updatedConversation);
		},
		[conversation, updateConversation]
	);

	return {
		conversation,
		isGenerating,
		initConversation,
		createNewConversation,
		generateAssistantMessage,
		regenerateAssistantMessage,
		loadConversation,
		stopMessageGeneration,
		updateConversation,
		navigateToNode,
		editUserMessage,
		updateConversationTitle,
		updateConversationModel
	};
};
