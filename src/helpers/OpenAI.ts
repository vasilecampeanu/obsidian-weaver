import { url } from "inspector";
import { Notice, requestUrl } from "obsidian";

const API_KEY = "";
const DEFAULT_URL = "https://api.openai.com/v1/chat/completions";

export const callOpenAIAPI = async (
	messages: { role: string; content: string }[],
	model: string = "gpt-3.5-turbo",
	max_tokens: number = 256,
	temperature: number = 0.3,
	top_p: number = 1,
	presence_penalty: number = 0.5,
	frequency_penalty: number = 0.5,
	stream: boolean = false,
	n: number = 1,
	stop: string[] | null = null,
	url: string | undefined = DEFAULT_URL, 
) => {
	try {
		const responseUrl = await requestUrl({
			method: "POST",
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				"Content-Type": "application/json"
			},
			contentType: "application/json",
			body: JSON.stringify({
				messages: messages,
				model: model,
				max_tokens: max_tokens,
				temperature: temperature,
				top_p: top_p,
				presence_penalty: presence_penalty,
				frequency_penalty: frequency_penalty,
				stream: stream,
				n: n,
				stop: stop,
			}),
			url: url,
			throw: false
		});

		try {
			const json = responseUrl.json;
			if (json && json.error) {
				new Notice(`[Response Url] = False Error :: ${json.error.message}`);
				throw new Error(JSON.stringify(json.error));
			}
		} catch (err) {
		}

		return JSON.parse(responseUrl.text).choices[0].message.content;
	} catch (error) {
	}
};
