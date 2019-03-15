export type DeferredState = "none" | "resolved" | "rejected";

export class Deferred<T = void> {
	public readonly resolve: (value: T) => void;
	public readonly reject: (reason?: any) => void;
	public readonly promise: Promise<T>;
	private _state: DeferredState = "none";
	public get state(): DeferredState {
		return this._state;
	}

	constructor() {
		let escapedResolve: (value: T) => void;
		let escapedReject: (reason?: any) => void;
		this.promise = new Promise((resolve, reject) => {
			escapedResolve = resolve;
			escapedReject = reject;
		});
		this.resolve = val => {
			this._state = "resolved";
			escapedResolve(val);
		};
		this.reject = reason => {
			this._state = "rejected";
			escapedReject(reason);
		};
	}
}

export class Barrier<T = void> {
	private readonly deferred = new Deferred<T>();

	public readonly unlock = this.deferred.resolve;
	public readonly reject = this.deferred.reject;
	public readonly onUnlocked = this.deferred.promise;
	public get state(): DeferredState {
		return this.deferred.state;
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
		this.popOrNext().resolve(value);
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
