import { createDisposable, emptyDisposable, IDisposable } from './disposable';
import { ISubscribable, SignalEmitter, SignalHandler } from './events';

export class CancellationTokenSource {
	private isCancelled: boolean = false;
	private reason: string|undefined;
	private readonly onCancel = new SignalEmitter();

	public cancel(reason?: string) {
		if (this.isCancelled) throw new Error("Token is already cancelled.");

		this.isCancelled = true;
		this.reason = reason;

		this.onCancel.emit();
	}

	public asDisposable(reason?: string) {
		return createDisposable(() => this.cancel(reason));
	}

	public readonly token = (new (CancellationToken as any)(this)) as CancellationToken;
}

export type CancellableResult<T> = { cancelled: false; result: T; } | { cancelled: true }

export class CancellationToken {
	public static empty: CancellationToken; 
	public onCancel(handler: () => void): IDisposable {
		if (this.isCancelled) {
			handler();
			return emptyDisposable;
		}
		else
			return this.source["onCancel"].one(handler);
	}

	private constructor(private readonly source: CancellationTokenSource) {}

	public throwIfCancelled() { if (this.isCancelled) throw new CancellationError(); }

	public get isCancelled() { return this.source["isCancelled"]; }

	public resolveOnCancel<T>(promise: PromiseLike<T>): PromiseLike<CancellableResult<T>> {
		return new Promise<CancellableResult<T>>((resolve, reject) => {
			const cancelSub = this.onCancel(() => resolve({ cancelled: true }));
			promise.then(val => { cancelSub.dispose(); resolve({ cancelled: false, result: val }); }, reject);
		})
	}

	public rejectOnCancel<T>(promise: PromiseLike<T>): PromiseLike<T> {
		return new Promise<T>((resolve, reject) => {
			const cancelSub = this.onCancel(() => reject(new CancellationError()));
			promise.then(val => { cancelSub.dispose(); resolve(val); }, reject);
		})
	}
}

export class CancellationError {

}