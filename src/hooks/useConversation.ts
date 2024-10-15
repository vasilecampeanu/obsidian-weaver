import { OpenAIRequestManager } from 'api/providers/OpenAIRequestManager';
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

	const createNewConversation = useCallback(
		async (title: string = 'Untitled') => {
			const newConversation = await createConversation(adapter, plugin.settings.weaverDirectory, title);
			setConversation(newConversation);
			setPreviousConversationId(newConversation.id);
			return newConversation;
		},
		[adapter, plugin.settings.weaverDirectory, setConversation, setPreviousConversationId]
	);

	const saveConversation = async (updatedConversation: IConversation) => {
		try {
			await writeConversation(adapter, plugin.settings.weaverDirectory, updatedConversation);
		} catch (error) {
			console.error('Failed to save conversation:', error);
		}
	};

	const updateConversation = async (updatedConversation: IConversation) => {
		setConversation(updatedConversation);
		await saveConversation(updatedConversation);
	};

	const generateAssistantMessage = useCallback(
		async (userMessage: string) => {
			if (!conversation) {
				throw new Error('No conversation initialized');
			}

			setIsGenerating(true);

			const now = Date.now() / 1000;
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
			let updatedConversation = {
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

			const assistantMessageNodeId = uuidv4();
			const assistantMessageNode: IMessageNode = {
				id: assistantMessageNodeId,
				message: {
					id: assistantMessageNodeId,
					author: { role: 'assistant', name: null, metadata: {} },
					create_time: now,
					update_time: now,
					content: {
						content_type: 'text',
						parts: [''],
					},
					status: 'in_progress',
					end_turn: false,
					weight: 1.0,
					metadata: {},
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
		[conversation, openAIManager, updateConversation]
	);

	const regenerateAssistantMessage = useCallback(
		async (messageId: string) => {
			if (!conversation) {
				throw new Error('No conversation initialized');
			}

			setIsGenerating(true);

			const now = Date.now() / 1000;

			// Get the assistant message node by messageId
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

			// Create a new assistant message node
			const assistantMessageNodeId = uuidv4();
			const assistantMessageNode: IMessageNode = {
				id: assistantMessageNodeId,
				message: {
					id: assistantMessageNodeId,
					author: { role: 'assistant', name: null, metadata: {} },
					create_time: now,
					update_time: now,
					content: {
						content_type: 'text',
						parts: [''],
					},
					status: 'in_progress',
					end_turn: false,
					weight: 1.0,
					metadata: {},
					recipient: 'all',
					channel: null,
				},
				parent: userMessageNodeId,
				children: [],
			};

			// Add assistant message node to conversation
			let updatedConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[assistantMessageNodeId]: assistantMessageNode,
					[userMessageNodeId]: {
						...userMessageNode,
						children: [...userMessageNode.children, assistantMessageNodeId],
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
		[conversation, openAIManager, updateConversation]
	);

	const streamAssistantResponse = async (
		conversation: IConversation,
		assistantMessageNode: IMessageNode,
		conversationPath: any[],
		controller: AbortController
	) => {
		let assistantContent = '';
		const assistantMessageNodeId = assistantMessageNode.id;

		const throttledSetConversation = throttle((updatedContent: string) => {
			const updatedAssistantNode: IMessageNode = {
				...assistantMessageNode,
				message: {
					...assistantMessageNode.message!,
					content: {
						...assistantMessageNode.message!.content,
						parts: [updatedContent],
					},
					update_time: Date.now() / 1000,
				},
			};

			const newConversation: IConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[assistantMessageNodeId]: updatedAssistantNode,
				},
				update_time: Date.now() / 1000,
			};

			setConversation(newConversation);
		}, 100);

		try {
			const responseStream = await openAIManager.sendMessageStream(
				conversationPath,
				'gpt-4',
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
					update_time: Date.now() / 1000,
				},
			};

			const finalConversation: IConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[assistantMessageNodeId]: finalAssistantNode,
				},
				current_node: assistantMessageNodeId,
				update_time: Date.now() / 1000,
			};

			await updateConversation(finalConversation);
		} catch (error: any) {
			if (error.name === 'AbortError') {
				console.log('Message generation was aborted');

				// Save the conversation with partial assistant content
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
						update_time: Date.now() / 1000,
					},
				};

				const partialConversation: IConversation = {
					...conversation,
					mapping: {
						...conversation.mapping,
						[assistantMessageNodeId]: partialAssistantNode,
					},
					current_node: assistantMessageNodeId,
					update_time: Date.now() / 1000,
				};

				await updateConversation(partialConversation);
			} else {
				console.error('Error generating assistant message:', error);

				// Optionally, save the conversation even on other errors
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
						update_time: Date.now() / 1000,
					},
				};

				const errorConversation: IConversation = {
					...conversation,
					mapping: {
						...conversation.mapping,
						[assistantMessageNodeId]: errorAssistantNode,
					},
					current_node: assistantMessageNodeId,
					update_time: Date.now() / 1000,
				};

				await updateConversation(errorConversation);
			}
		} finally {
			setIsGenerating(false);
			setAbortController(null);
		}
	};

	const getConversationPathToNode = (conversation: IConversation, nodeId: string): IMessageNode[] => {
		const path: IMessageNode[] = [];
		let currentNodeId = nodeId;

		while (currentNodeId) {
			const node = conversation.mapping[currentNodeId];
			if (!node) break;

			path.unshift(node);

			currentNodeId = node.parent!;
		}

		return path;
	};

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

	const stopMessageGeneration = useCallback(() => {
		if (abortController) {
			abortController.abort();
		}
	}, [abortController]);

	const navigateToNode = useCallback(
		async (nodeId: string) => {
			if (!conversation) return;

			const updatedConversation = {
				...conversation,
				current_node: nodeId,
				update_time: Date.now() / 1000,
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
		navigateToNode
	};
};
