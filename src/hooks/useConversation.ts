import { OpenAIRequestManager } from 'api/providers/OpenAIRequestManager';
import { EChatModels } from 'enums/EProviders';
import { throttle } from 'helpers/Async';
import {
	createConversation,
	deleteConversation,
	getConversation,
	writeConversation
} from 'helpers/ConversationIOController';
import { IContent, IContentType, IConversation, IMessage, IMessageNode } from 'interfaces/IConversation';
import { IUserSelection } from 'interfaces/IUserEvents';
import { FileSystemAdapter } from 'obsidian';
import { usePlugin } from 'providers/plugin/usePlugin';
import { useStore } from 'providers/store/useStore';
import { useCallback, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addMessageNodeToConversation, buildParts, createMessageNode, updateAssistantMessageNode } from './helpers';

export const useConversation = () => {
	const plugin = usePlugin();

	const conversation = useStore((state) => state.conversation);
	const setConversation = useStore((state) => state.setConversation);

	const previousConversationId = useStore((state) => state.previousConversationId);
	const setPreviousConversationId = useStore((state) => state.setPreviousConversationId);

	const isGenerating = useStore((state) => state.isGenerating);
	const setIsGenerating = useStore((state) => state.setIsGenerating);

	const [abortController, setAbortController] = useState<AbortController | null>(null);

	const openAIManager = useMemo(() => new OpenAIRequestManager(plugin.settings.apiKey), [plugin.settings.apiKey]);
	const adapter = useMemo(() => plugin.app.vault.adapter as FileSystemAdapter, [plugin.app.vault.adapter]);

	//#region Conversation Initialization and Management

	const loadConversation = useCallback(async (conversationId: string) => {
		try {
			const loadedConversation = await getConversation(adapter, plugin.settings.weaverDirectory, conversationId);
			if (!loadedConversation) throw new Error(`Conversation with ID ${conversationId} not found`);
			setConversation(loadedConversation);
			setPreviousConversationId(loadedConversation.id);
		} catch (error) {
			console.error(`Failed to load conversation with ID ${conversationId}:`, error);
		}
	}, [adapter, plugin.settings.weaverDirectory, setConversation, setPreviousConversationId]);

	const createNewConversation = useCallback(async (title: string = 'Untitled') => {
		try {
			const newConversation = await createConversation(adapter, plugin.settings.model, plugin.settings.systemPrompt, plugin.settings.weaverDirectory, title);
			setConversation(newConversation);
			setPreviousConversationId(newConversation.id);
			return newConversation;
		} catch (error) {
			console.error('Failed to create new conversation:', error);
			return null;
		}
	}, [adapter, plugin.settings.model, plugin.settings.systemPrompt, plugin.settings.weaverDirectory, setConversation, setPreviousConversationId]);

	const initConversation = useCallback(async (createnew: boolean = false, title: string = 'Untitled') => {
		try {
			if (plugin.settings.loadLastConversation && previousConversationId && !createnew) {
				await loadConversation(previousConversationId);
				return;
			}
			await createNewConversation(title);
		} catch (error) {
			console.error('Failed to initialize conversation:', error);
		}
	}, [plugin.settings.loadLastConversation, previousConversationId, loadConversation, createNewConversation]);

	const deleteConversationById = useCallback(async (conversationId: string) => {
		try {
			await deleteConversation(adapter, plugin.settings.weaverDirectory, conversationId);
			if (conversationId === previousConversationId) setPreviousConversationId(null);
			setConversation(null);
		} catch (error) {
			console.error(`Failed to delete conversation with ID ${conversationId}:`, error);
		}
	}, [adapter, plugin.settings.weaverDirectory, previousConversationId, setPreviousConversationId, setConversation]);

	const saveConversation = useCallback(async (updatedConversation: IConversation) => {
		try {
			await writeConversation(adapter, plugin.settings.weaverDirectory, updatedConversation);
		} catch (error) {
			console.error('Failed to save conversation:', error);
		}
	}, [adapter, plugin.settings.weaverDirectory]);

	const updateConversation = useCallback(async (updatedConversation: IConversation) => {
		setConversation(updatedConversation);
		await saveConversation(updatedConversation);
	}, [setConversation, saveConversation]);

	const updateConversationTitle = useCallback(async (newTitle: string) => {
		if (!conversation) return;
		const now = Date.now() / 1000;
		const updatedConversation: IConversation = {
			...conversation,
			title: newTitle,
			update_time: now,
		};
		await updateConversation(updatedConversation);
	}, [conversation, updateConversation]);

	const updateConversationModel = useCallback(async (model: EChatModels) => {
		if (!conversation) return;
		const now = Date.now() / 1000;
		const updatedConversation: IConversation = {
			...conversation,
			default_model_slug: model,
			update_time: now,
		};
		await updateConversation(updatedConversation);
	}, [conversation, updateConversation]);

	//#endregion

	//#region Streaming and Assistant Response

	const streamAssistantResponse = useCallback(async (
		conversation: IConversation,
		assistantMessageNode: IMessageNode,
		conversationPath: IMessage[],
		controller: AbortController,
		model?: EChatModels
	) => {
		let assistantContent = '';
		const throttledSetConversation = throttle((updatedContent: string) => {
			const updatedConversation = updateAssistantMessageNode(
				conversation,
				assistantMessageNode,
				updatedContent,
				'in_progress',
				false
			);
			setConversation(updatedConversation);
		}, 100);

		let finalConversation: IConversation | null = null;

		try {
			const responseStream = await openAIManager.sendMessageStream(
				conversationPath,
				model || conversation.default_model_slug,
				controller.signal
			);

			for await (const chunk of responseStream) {
				const delta = chunk.choices[0].delta.content || '';
				if (delta) {
					assistantContent += delta;
					throttledSetConversation(assistantContent);
				}
			}

			finalConversation = updateAssistantMessageNode(
				conversation,
				assistantMessageNode,
				assistantContent,
				'finished_successfully',
				true
			);
		} catch (error: any) {
			if (error.name === 'AbortError') {
				finalConversation = updateAssistantMessageNode(
					conversation,
					assistantMessageNode,
					assistantContent,
					'aborted',
					false
				);
			} else {
				console.error('Error generating assistant message:', error);
				finalConversation = updateAssistantMessageNode(
					conversation,
					assistantMessageNode,
					error.message,
					'error',
					false
				);
			}
		} finally {
			if (finalConversation) await updateConversation(finalConversation);
			setIsGenerating(false);
			setAbortController(null);
		}
	}, [openAIManager, setConversation, updateConversation, setIsGenerating, setAbortController]);

	//#endregion

	//#region Navigation and Utility

	const getConversationPathToNode = useCallback((conversation: IConversation, nodeId: string): IMessageNode[] => {
		const path: IMessageNode[] = [];
		let currentNodeId = nodeId;
		while (currentNodeId) {
			const node = conversation.mapping[currentNodeId];
			if (!node) break;
			path.unshift(node);
			currentNodeId = node.parent!;
		}
		return path;
	}, []);

	const navigateToNode = useCallback(async (nodeId: string) => {
		if (!conversation) return;
		const now = Date.now() / 1000;
		const updatedConversation: IConversation = {
			...conversation,
			current_node: nodeId,
			update_time: now
		};
		await updateConversation(updatedConversation);
	}, [conversation, updateConversation]);

	//#endregion

	//#region Message Generation and Editing

	const generateAssistantMessage = useCallback(async (
		userMessage: string,
		selection?: IUserSelection | null,
		regenerateMessageId?: string,
		model?: EChatModels,
		userMessageNodeParam?: IMessageNode
	) => {
		if (!conversation) throw new Error('No conversation initialized');

		setIsGenerating(true);

		let userMessageNodeId: string;
		let userMessageNode: IMessageNode;
		let updatedConversation: IConversation = conversation;

		try {
			if (userMessageNodeParam) {
				userMessageNode = userMessageNodeParam;
				userMessageNodeId = userMessageNode.id;
				updatedConversation = addMessageNodeToConversation(conversation, userMessageNode);
				await updateConversation(updatedConversation);
			} else if (regenerateMessageId) {
				const assistantNodeToRegenerate = conversation.mapping[regenerateMessageId];
				if (!assistantNodeToRegenerate || assistantNodeToRegenerate.message?.author.role !== 'assistant') {
					throw new Error('Provided messageId is not an assistant message');
				}
				userMessageNodeId = assistantNodeToRegenerate.parent!;
				if (!userMessageNodeId) throw new Error('No parent user message node found for regeneration');
				userMessageNode = conversation.mapping[userMessageNodeId];
				if (!userMessageNode || userMessageNode.message?.author.role !== 'user') {
					throw new Error('Parent node is not a user message');
				}
			} else {
				userMessageNodeId = uuidv4();
				const userContent: IContent = {
					content_type: selection?.text ? 'text-with-user-selection' : 'text',
					parts: buildParts(selection, userMessage),
				};
				userMessageNode = createMessageNode(
					userMessageNodeId,
					'user',
					userContent,
					conversation.current_node,
					{},
					undefined,
					'finished_successfully',
					true
				);
				updatedConversation = addMessageNodeToConversation(conversation, userMessageNode);
				await updateConversation(updatedConversation);
			}

			const conversationPath = getConversationPathToNode(updatedConversation, userMessageNodeId)
				.filter((node) => node.message)
				.map((node) => node.message!);

			const assistantMessageNodeId = uuidv4();
			const assistantContent: IContent = {
				content_type: 'text',
				parts: [''],
			};

			const assistantMessageNode = createMessageNode(
				assistantMessageNodeId,
				'assistant',
				assistantContent,
				userMessageNodeId,
				{},
				model || updatedConversation.default_model_slug,
				'in_progress',
				false
			);

			updatedConversation = addMessageNodeToConversation(updatedConversation, assistantMessageNode);
			await updateConversation(updatedConversation);

			const controller = new AbortController();
			setAbortController(controller);

			await streamAssistantResponse(
				updatedConversation,
				assistantMessageNode,
				conversationPath,
				controller,
				model
			);
		} catch (error) {
			console.error('Error in generateAssistantMessage:', error);
			setIsGenerating(false);
			setAbortController(null);
		}
	}, [conversation, isGenerating, setIsGenerating, setAbortController, updateConversation, getConversationPathToNode, streamAssistantResponse]);

	const editUserMessage = useCallback(async (messageId: string, contentType: IContentType, content: string[]) => {
		if (!conversation) throw new Error('No conversation initialized');
		setIsGenerating(true);

		try {
			const originalUserNode = conversation.mapping[messageId];
			if (!originalUserNode || originalUserNode.message?.author.role !== 'user') {
				throw new Error('Provided messageId is not a user message');
			}

			const parentNodeId = originalUserNode.parent;
			if (!parentNodeId) throw new Error('No parent node found for the user message');

			const newUserMessageNodeId = uuidv4();
			const newUserMessageNode = createMessageNode(
				newUserMessageNodeId,
				'user',
				{
					content_type: contentType,
					parts: [...content],
				},
				parentNodeId,
				{},
				undefined,
				'finished_successfully',
				true
			);
			await generateAssistantMessage('', undefined, undefined, undefined, newUserMessageNode);
		} catch (error) {
			console.error('Error in editUserMessage:', error);
			setIsGenerating(false);
		}
	}, [conversation, setIsGenerating, generateAssistantMessage]);

	const stopMessageGeneration = useCallback(() => {
		if (abortController) {
			abortController.abort();
			setAbortController(null);
		}
	}, [abortController]);

	//#endregion

	return {
		conversation,
		isGenerating,

		// Conversation Management
		initConversation,
		createNewConversation,
		deleteConversationById,
		loadConversation,
		updateConversation,
		updateConversationTitle,
		updateConversationModel,

		// Navigation
		navigateToNode,

		// Message Generation and Editing
		generateAssistantMessage,
		editUserMessage,
		stopMessageGeneration,
	};
};
