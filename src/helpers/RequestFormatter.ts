import { App } from "obsidian";
import Weaver from "main";
import { WeaverSettings } from "settings";
import { IChatMessage } from "components/chat/ConversationDialogue";
import { Searcher } from 'fast-fuzzy';

import jaroWinkler from 'jaro-winkler';

interface BodyParameters {
	model: string;
	max_tokens: number;
	temperature: number;
	frequency_penalty: number;
	messages?: { role: string; content: string }[];
}

interface KeywordToPrompt {
	[keyword: string]: string;
}

export default class RequestFormatter {
	private readonly plugin: Weaver;

	constructor(plugin: Weaver) {
		this.plugin = plugin;
	}

	keywordToPrompt: KeywordToPrompt = {
		'list': 'The ASSISTANT will create a list using markdown format.',
		'table': 'The ASSISTANT will create a table using markdown format.',
		'quote': 'The ASSISTANT will provide a quote and format it using markdown.',
		'program': 'The ASSISTANT will provide a code snippet in the requested programming language and an explantion, formatted using markdown.',
		'algorithm': 'The ASSISTANT will provide a code snippet in the requested programming language, formatted using markdown.',
		'optimize': 'The ASSISTANT will provide a code snippet in the requested programming language, formatted using markdown.',
		'essay': 'The ASSISTANT will provide an outline for an essay on the given topic, formatted using markdown.',
		'story': 'The ASSISTANT will provide an outline for a story, formatted using markdown.',
		'summary': 'The ASSISTANT will summarize the given text or topic and provide an outline of the text, formatted using markdown.',
		'recipe': 'The ASSISTANT will provide a recipe based on the given ingredients or cuisine, formatted using markdown.',
		'debate': 'The ASSISTANT will outline arguments for and against a given topic, formatted using markdown.',
		'comparison': 'The ASSISTANT will compare and contrast two or more items, concepts, or ideas, formatted using markdown.',
		'review': 'The ASSISTANT will provide a review of a book, movie, product, or service, formatted using markdown.',
		'tutorial': 'The ASSISTANT will provide a step-by-step tutorial or guide on a specific topic or task, formatted using markdown.',
		'analysis': 'The ASSISTANT will provide an in-depth analysis of a given subject, event, or trend, formatted using markdown.',
		'biography': 'The ASSISTANT will provide a brief biography of a notable person or historical figure, formatted using markdown.',
		'problem': 'The ASSISTANT will help solve a given problem or provide suggestions for improvement, formatted using markdown.',
		'trivia': 'The ASSISTANT will provide interesting facts, trivia, or information on a specified topic, formatted using markdown.',
	};

	keywords = Object.keys(this.keywordToPrompt);
	searcher = new Searcher(this.keywords);

	generateMarkdownContent = (message: string, role: string): string => {
		const isMarkdownWorthy = (text: string): string | null => {
			const words = text.toLowerCase().split(/\s+/);
			const wordSet = new Set(words);
			
			let bestMatch = null;
			let bestScore = 0;
		
			for (const keyword of this.keywords) {
				let keywordScore = 0;
				const keywordWords = keyword.split(/\s+/);

				for (const word of keywordWords) {
					if (wordSet.has(word)) {
						keywordScore += 1;
					} else {
						const wordScores = words.map((inputWord) => jaroWinkler(word, inputWord));
						const maxWordScore = Math.max(...wordScores);
						keywordScore += maxWordScore;
					}
				}

				keywordScore /= keywordWords.length;

				if (keywordScore > bestScore) {
					bestScore = keywordScore;
					bestMatch = keyword;
				}
			}
		
			if (bestScore > 0.9) {
				return bestMatch;
			}
		
			return null;
		};
		
		const keyword: string | null = isMarkdownWorthy(message);

		if (role === "user" && keyword !== null) {
			return `prompt: "${message}" \n task: ${this.keywordToPrompt[keyword]}`;
		} else {
			return message;
		}
	};

	prepareChatRequestParameters(parameters: WeaverSettings, additionalParameters: any = {}, conversationHistory: IChatMessage[] = []) {
		try {
			const requestUrlBase = "https://api.openai.com/v1";
			let requestUrl = `${requestUrlBase}/chat/completions`;

			const bodyParameters: BodyParameters = {
				model: parameters.engine,
				max_tokens: parameters.max_tokens,
				temperature: parameters.temperature,
				frequency_penalty: parameters.frequency_penalty,
			};

			bodyParameters.messages = conversationHistory.map((message) => {
				return { role: message.role, content: this.generateMarkdownContent(message.content, message.role) };
			});

			const mergedBodyParameters = { ...bodyParameters, ...additionalParameters?.bodyParameters };

			const requestParameters = {
				url: requestUrl,
				method: "POST",
				body: JSON.stringify(mergedBodyParameters),
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${parameters.api_key}`,
				}
			};

			return { ...requestParameters, ...additionalParameters?.requestParameters };
		} catch (error) {
			console.error('Error in prepareChatRequestParameters:', error);
			throw error;
		}
	}
}
