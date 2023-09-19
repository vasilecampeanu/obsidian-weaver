type EventListener = (...args: any[]) => void;

interface EventMap {
	[eventName: string]: EventListener[];
}

class EventEmitter {
	private events: EventMap = {};

	on(eventName: string, listener: EventListener): this {
		if (typeof listener !== 'function') {
			throw new TypeError('The listener must be a function.');
		}

		if (!this.events[eventName]) {
			this.events[eventName] = [];
		}

		this.events[eventName].push(listener);

		return this;
	}

	off(eventName: string, listener: EventListener): this {
		if (!this.events[eventName]) return this;

		this.events[eventName] = this.events[eventName].filter(
			(l) => l !== listener
		);

		return this;
	}

	emit(eventName: string, ...args: any[]): this {
		if (!this.events[eventName]) return this;

		this.events[eventName].forEach((listener) => {
			try {
				listener(...args);
			} catch (error) {
				console.error(`Error occurred in listener: ${error}`);
			}
		});

		return this;
	}
}

export const eventEmitter = new EventEmitter();
