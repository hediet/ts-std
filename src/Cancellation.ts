import { ISubscribable, SignalEmitter, SignalHandler } from './Events';

export class CancellationTokenSource {
	private isCancelled: boolean = false;
	private reason: string|undefined;
	private readonly onCancel = new SignalEmitter();

	public cancel(reason?: string) {
		if (this.isCancelled) throw new Error("Token is already cancelled.");

		this.isCancelled = true;
		this.reason = reason;

		this.onCancel.dispatch();
	}

	public readonly token = new CancellationToken(this);
}

export interface CancellableResult<T> {
	result?: T;
	cancelled: boolean;
}

export class CancellationToken {
	public static empty: CancellationToken; 
	public onCancel = this.source["onCancel"].asEvent();

	constructor(private readonly source: CancellationTokenSource) {}

	public throwIfCancelled() { if (this.isCancelled) throw new CancellationError(); }

	public get isCancelled() { return this.source["isCancelled"]; }

	public makeCancellable<T>(promise: PromiseLike<T>): PromiseLike<CancellableResult<T>> {
		return new Promise<CancellableResult<T>>((resolve, reject) => {
			const removeEvent = this.onCancel.one(() => resolve({ cancelled: true }));
			promise.then(val => { removeEvent.dispose(); resolve({ cancelled: false, result: val }) }, reject);
		})
	}
}

export class CancellationError {

}

