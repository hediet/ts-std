import { dispose, Disposable, disposable } from './Disposable';

export class CancellationTokenSource {

	private isCancelled: boolean = false;
	private reason: string|undefined;
	private listeners: { [index: number]: () => void } = { };
	private listenerId: number = 0;

	public cancel(reason?: string) {
		if (this.isCancelled) throw new Error("Token is already cancelled.");

		this.isCancelled = true;
		this.reason = reason;

		for (var key in this.listeners) {
			this.listeners[key]();
		}

		this.listeners = {};
	}

	public readonly token = new CancellationToken(this);
}

export interface CancellableResult<T> {
	result?: T;
	cancelled: boolean;
}

export class CancellationToken {
	public static empty: CancellationToken; 

	constructor(private readonly source: CancellationTokenSource) {
	}

	public throwIfCancelled() { if (this.isCancelled) throw new CancellationError(); }

	public get isCancelled() { return this.source["isCancelled"]; }

	public makeCancellable<T>(promise: PromiseLike<T>): PromiseLike<CancellableResult<T>> {
		
		return new Promise<CancellableResult<T>>((resolve, reject) => {

			this.onCancel(() => resolve({ cancelled: true }));

			promise.then(val => resolve({ cancelled: false, result: val }), reject);
		})
	}

	public onCancel(callback: () => void): Disposable {
		const listenerId = this.source["listenerId"]++;
		this.source["listeners"][listenerId] = callback;
		return disposable(() => delete this.source["listeners"][listenerId]);
	}
}

export class CancellationError {

}

