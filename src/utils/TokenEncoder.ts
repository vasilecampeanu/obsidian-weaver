import { Tiktoken, TiktokenBPE, TiktokenEncoding, TiktokenModel, getEncodingNameForModel } from "js-tiktoken";

interface EncodingCache {
	[key: string]: TiktokenBPE;
}

export class TokenEncoder {
	private static encodingCache: EncodingCache = {};

	constructor(
		private model: TiktokenModel,
		private extendedSpecialTokens?: Record<string, number>,
	) {}

	private async loadEncodingFromURL(encoding: TiktokenEncoding): Promise<TiktokenBPE> {
		if (!TokenEncoder.encodingCache[encoding]) {
			try {
				const res = await fetch(`https://tiktoken.pages.dev/js/${encoding}.json`);

				if (!res.ok) {
					throw new Error(`Failed to fetch encoding data for ${encoding} from the specified URL.`);
				}

				TokenEncoder.encodingCache[encoding] = await res.json();
			} catch (error) {
				console.error(error);
				throw new Error(`Error loading encoding for ${encoding}.`);
			}
		}

		return TokenEncoder.encodingCache[encoding];
	}

	public static addEncodingToCache(encoding: string, data: TiktokenBPE): void {
		TokenEncoder.encodingCache[encoding] = data;
	}

	private async instantiateTokenEncoder(): Promise<Tiktoken> {
		const encodingName = getEncodingNameForModel(this.model);
		const encodingData = await this.loadEncodingFromURL(encodingName);
		return new Tiktoken(encodingData, this.extendedSpecialTokens);
	}

	public async getTokenCountForText(text: string): Promise<number> {
		const encoder = await this.instantiateTokenEncoder();
		return encoder.encode(text).length;
	}
}
