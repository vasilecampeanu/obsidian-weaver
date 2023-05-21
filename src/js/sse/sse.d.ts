declare module "sse" {
    export interface CustomEventInit extends EventInit {
        status?: number;
        readyState?: number;
    }

    export class CustomEvent extends Event {
        constructor(typeArg: string, eventInitDict?: CustomEventInit);
        data?: string;
        id?: string | null;
        status?: number;
        readyState?: number;
    }

    export class SSE {
        readonly INITIALIZING: number;
        readonly CONNECTING: number;
        readonly OPEN: number;
        readonly CLOSED: number;

        url: string;
        headers: Record<string, string>;
        payload: string;
        method: string;
        withCredentials: boolean;
        readonly FIELD_SEPARATOR: string;
        listeners: Record<string, Array<(e: any) => void>>;
        xhr: XMLHttpRequest | null;
        readyState: number;
        progress: number;
        chunk: string;

        constructor(url: string, options?: Partial<{
            headers: Record<string, string>;
            payload: string;
            method: string;
            withCredentials: boolean;
        }>);

        addEventListener(type: string, listener: (e: any) => void): void;
        removeEventListener(type: string, listener: (e: any) => void): void;
        dispatchEvent(e: CustomEvent | null): boolean;
        stream(): void;
        close(): void;
    }
}
