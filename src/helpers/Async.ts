/**
 * Custom throttle function to limit the frequency of function calls.
 * @param func The function to throttle.
 * @param limit The time limit in milliseconds.
 * @returns A throttled version of the input function.
 */
export function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
	let lastCall = 0;
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (this: any, ...args: any[]) {
		const now = Date.now();

		if (now - lastCall >= limit) {
			lastCall = now;
			func.apply(this, args);
		} else {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => {
				lastCall = Date.now();
				func.apply(this, args);
			}, limit - (now - lastCall));
		}
	} as T;
}
