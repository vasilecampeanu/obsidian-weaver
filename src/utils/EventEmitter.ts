// EventEmitter.ts
interface EventListener {
	(...args: any[]): void;
}

interface EventMap {
	[eventName: string]: EventListener[];
}

class EventEmitter {
	private events: EventMap = {};

	on(eventName: string, listener: EventListener): void {
		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}
		this.events[eventName].push(listener);
	}

	off(eventName: string, listener: EventListener): void {
		if (!this.events[eventName]) return;
		this.events[eventName] = this.events[eventName].filter(
			(l) => l !== listener
		);
	}

	emit(eventName: string, ...args: any[]): void {
		if (!this.events[eventName]) return;
		this.events[eventName].forEach((listener) => listener(...args));
	}
}

export const eventEmitter = new EventEmitter();
