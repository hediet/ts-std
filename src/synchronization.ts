export class Deferred<T> {
	public readonly setValue: (value: T) => void;
	public readonly reject: (reason: string) => void;
	public readonly promise: Promise<T>;

	constructor() {
		let escapedResolve: (value: T) => void;
		let escapedReject: (reason: string) => void;
		this.promise = new Promise((resolve, reject) => {
			escapedResolve = resolve;
			escapedReject = reject;
		});
		this.setValue = escapedResolve!;
		this.reject = escapedReject!;
	}
}

export class Barrier<T> {
	public readonly unlock: (value: T) => void;
	public readonly reject: (reason: string) => void;
	public readonly onUnlocked: Promise<T>;

	constructor() {
		const d = new Deferred<T>();
		this.onUnlocked = d.promise;
		this.unlock = d.setValue;
		this.reject = d.reject;
	}
}

export class ProducerConsumer<T> {
	private barriers: Deferred<T>[] = [];
	private nextBarriers: Deferred<T>[] = [];

	private popOrNext(): Deferred<T> {
		let b = this.barriers.shift();
		if (!b) {
			b = new Deferred<T>();
			this.nextBarriers.push(b);
		}
		return b;
	}

	public produce(value: T) {
		this.popOrNext().setValue(value);
	}

	public rejectSingle(reason: string) {
		this.popOrNext().reject(reason);
	}

	public consume(): Promise<T> {
		let b = this.nextBarriers.shift();
		if (!b) {
			b = new Deferred<T>();
			this.barriers.push(b);
		}
		return b.promise;
	}
}
