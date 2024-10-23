export enum EChatModels {
	GPT_4o = "gpt-4o",
	GPT_4o_mini = "gpt-4o-mini"
}

export const modelDescriptions: Record<EChatModels, string> = {
	[EChatModels.GPT_4o]: "Great for most tasks",
	[EChatModels.GPT_4o_mini]: "Faster for everyday tasks"
};
