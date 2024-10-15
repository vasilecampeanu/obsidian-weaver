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

	const generateAssistantMessage = useCallback(
		async (userMessage: string) => {
			if (!conversation) {
				throw new Error('No conversation initialized');
			}

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

			// Update the conversation in memory
			const updatedConversation: IConversation = {
				...conversation,
				mapping: {
					...conversation.mapping,
					[userMessageNodeId]: userMessageNode,
				},
				current_node: userMessageNodeId,
				update_time: now,
			};

			// Update the parent node's children
			const parentNodeId = userMessageNode.parent;
			if (parentNodeId) {
				const parentNode = updatedConversation.mapping[parentNodeId];
				if (parentNode && !parentNode.children.includes(userMessageNode.id)) {
					updatedConversation.mapping[parentNodeId] = {
						...parentNode,
						children: [...parentNode.children, userMessageNode.id],
					};
				}
			}

			setConversation(updatedConversation);

			// Prepare messages for OpenAI
			const conversationPath = Object.values(updatedConversation.mapping)
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
				parent: userMessageNode.id,
				children: [],
			};

			// Update the conversation with assistant message node
			updatedConversation.mapping[assistantMessageNodeId] = assistantMessageNode;
			updatedConversation.current_node = assistantMessageNodeId;

			// Update the user node's children
			updatedConversation.mapping[userMessageNode.id] = {
				...updatedConversation.mapping[userMessageNode.id],
				children: [...updatedConversation.mapping[userMessageNode.id].children, assistantMessageNode.id],
			};

			setConversation(updatedConversation);

			const controller = new AbortController();
			setAbortController(controller);

			// Local variable to accumulate assistant message content
			let assistantContent = '';

			// Throttled function to update the conversation state
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
					...updatedConversation,
					mapping: {
						...updatedConversation.mapping,
						[assistantMessageNodeId]: updatedAssistantNode,
					},
					update_time: Date.now() / 1000,
				};

				setConversation(newConversation);
			}, 100); // Throttle to update every 100ms

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
					...updatedConversation,
					mapping: {
						...updatedConversation.mapping,
						[assistantMessageNodeId]: finalAssistantNode,
					},
					current_node: assistantMessageNodeId,
					update_time: Date.now() / 1000,
				};

				setConversation(finalConversation);

				// Write the updated conversation to file
				await writeConversation(adapter, plugin.settings.weaverDirectory, finalConversation);
			} catch (error: any) {
				if (error.name === 'AbortError') {
					console.log('Message generation was aborted');
				} else {
					console.error('Error generating assistant message:', error);
				}
			} finally {
				setAbortController(null);
			}
		},
		[conversation, openAIManager, setConversation, adapter, plugin.settings.weaverDirectory]
	);

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

	const getConversationPathWithBranches = useCallback((): IMessageNode[] => {
		if (!conversation) return [];

		const traverse = (nodeId: string, path: IMessageNode[]) => {
			const node = conversation.mapping[nodeId];

			if (!node) return;

			if (node.message?.author.role !== 'system') {
				path.push(node);
			}

			node.children.forEach((childId) => traverse(childId, path));
		};

		const path: IMessageNode[] = [];

		traverse(conversation.current_node, path);

		return path;
	}, [conversation]);

	return {
		conversation,
		initConversation,
		createNewConversation,
		generateAssistantMessage,
		loadConversation,
		stopMessageGeneration,
		getConversationPathWithBranches,
	};
};
