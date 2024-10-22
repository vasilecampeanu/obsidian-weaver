export enum EChatModels {
	GPT_4o = "gpt-4o",
	GPT_4o_mini = "gpt-4o-mini",	
	GPT_4 = "gpt-4",
}

export const modelDescriptions: Record<EChatModels, string> = {
	[EChatModels.GPT_4]: "Legacy model",
	[EChatModels.GPT_4o]: "Great for most tasks",
	[EChatModels.GPT_4o_mini]: "Faster at reasoning",
};
