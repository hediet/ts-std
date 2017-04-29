import { CancellationToken, CancellationTokenSource, CancellationError } from './cancellation';
import { createDisposable, Disposable, IDisposable } from './disposable';
import { SignalEmitter, SignalSource } from "./events";

export function startTimerCallImmediately(intervalMs: number, callback: () => void): IDisposable {
	callback();
	const handle = setInterval(callback, intervalMs);
	return createDisposable(() => clearInterval(handle));
}

export function startTimer(intervalMs: number, callback: () => void): IDisposable {
	const handle = setInterval(callback, intervalMs);
	return createDisposable(() => clearInterval(handle));
}

export function startTimeout(intervalMs: number, callback: () => void): IDisposable {
	const handle = setTimeout(callback, intervalMs);
	return createDisposable(() => clearTimeout(handle));
}

export class EventTimer extends Disposable {
	protected emitter: SignalEmitter = new SignalEmitter();
	public readonly onTick: SignalSource = this.emitter.asEvent();

	constructor(intervalMs: number) {
		super();
		this.addDisposable(startTimer(intervalMs, () => this.emitter.emit()));
	}
}

export function wait(intervalMs: number, cancellationToken: CancellationToken = CancellationToken.empty, rejectOnCancel: boolean = false): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const handle = setTimeout(() => {
			onCancelSub.dispose();
			if (!cancellationToken.isCancelled)
				resolve();
		}, intervalMs);

		const onCancelSub = cancellationToken.onCancel(() => {
			clearTimeout(handle);
			if (rejectOnCancel)
				reject(new CancellationError());
			else
				resolve();
		});
	});
}