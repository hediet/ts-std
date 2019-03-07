//import { CancellationToken, CancellationError } from './cancellation';
import {
	Disposable,
	DisposableComponent,
	DisposableLike,
	dispose,
} from "./disposable";
import { EventEmitter } from "./events";

export function startIntervalCallImmediately(
	intervalMs: number,
	callback: () => void
): Disposable {
	callback();
	const handle = setInterval(callback, intervalMs);
	return Disposable.create(() => clearInterval(handle));
}

export function startInterval(
	intervalMs: number,
	callback: () => void
): Disposable {
	const handle = setInterval(callback, intervalMs);
	return Disposable.create(() => clearInterval(handle));
}

export function startTimeout(
	intervalMs: number,
	callback: () => void
): Disposable {
	const handle = setTimeout(callback, intervalMs);
	return Disposable.create(() => clearTimeout(handle));
}

export class EventTimer extends DisposableComponent {
	protected emitter = new EventEmitter();
	public readonly onTick = this.emitter.asEvent();

	constructor(intervalMs: number) {
		super();
		this.addDisposable(
			startInterval(intervalMs, () => this.emitter.emit(undefined, this))
		);
	}
}

export function wait(intervalMs: number): Promise<void> {
	return new Promise<void>(resolve => {
		setTimeout(() => resolve(), intervalMs);
	});
}

/*
export function wait(
	intervalMs: number, cancellationToken?: CancellationToken, rejectOnCancel: boolean = false
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let cancelSub: DisposableLike = undefined;
		const handle = setTimeout(() => {
			dispose(cancelSub);
			if (!cancellationToken || !cancellationToken.isCancelled) {
				resolve();
			}
		}, intervalMs);

		
		if (cancellationToken) {
			cancelSub = cancellationToken.onCancel(() => {
				clearTimeout(handle);
				if (rejectOnCancel) {
					reject(new CancellationError());
				} else {
					resolve();
				}
			});
		}
		
	});
}
*/
