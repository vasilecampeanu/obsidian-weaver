import Weaver from "main";
import { App } from "obsidian";
import { WeaverSettings } from "settings";

export default class RequestFormatter {
	plugin: Weaver;
	app: App;

	constructor(app: App, plugin: Weaver) {
		this.plugin = plugin;
		this.app = app;
	}

	addContext(parameters: WeaverSettings, prompt: string) {
		const params = {
			...parameters,
			prompt
		}
	
		return params;
	}
	

	prepareRequestParameters(params: WeaverSettings, additionalParams: any = {}) {
		const bodyParams: any = {
			model: params.engine,
			max_tokens: params.max_tokens,
			temperature: params.temperature,
			frequency_penalty: params.frequency_penalty,
		};

		const requestUrlBase = "https://api.openai.com/v1";

		let requestUrl = `${requestUrlBase}/completions`;
		let requestExtractResult = "jsonResponse?.choices[0].text";

		const chatModels = ["gpt-3.5-turbo", "gpt-3.5-turbo-0301", "gpt-4"];

		if (params.engine && chatModels.includes(params.engine)) {
			requestUrl = `${requestUrlBase}/chat/completions`;
			requestExtractResult = "jsonResponse?.choices[0].message.content";
			bodyParams.messages = params.prompt.split('\n').map(line => {
				const [role, content] = line.split(/:(.+)/);
				return { role: role.toLowerCase(), content };
			});
		} else {
			bodyParams.prompt = params.prompt;
		}

		const mergedBodyParams = { ...bodyParams, ...additionalParams?.bodyParams };

		const requestParams = {
			url: requestUrl,
			method: "POST",
			body: JSON.stringify(mergedBodyParams),
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${params.api_key}`,
			},
			extractResult: requestExtractResult,
		};

		return {...requestParams, ...additionalParams?.requestParams};
	}
}