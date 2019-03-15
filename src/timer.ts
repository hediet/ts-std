//import { CancellationToken, CancellationError } from './cancellation';
import { Disposable, DisposableComponent } from "./disposable";
import { EventEmitter } from "./events";
import { Barrier } from "./synchronization";

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

export class ResettableTimeout {
	private source = new Barrier();
	public readonly onTimeout = this.source.onUnlocked;
	public get timedOut(): boolean {
		return this.source.state !== "none";
	}
	private timeout: Disposable | undefined;

	constructor(private readonly timeoutMs: number) {
		this.startOrRestartTimeout(timeoutMs);
	}

	private startOrRestartTimeout(timeoutMs: number) {
		if (this.timeout) {
			this.timeout.dispose();
			this.timeout = undefined;
		}
		this.timeout = startTimeout(timeoutMs, () => this.source.unlock());
	}

	public reset(newTimeoutMs?: number): void {
		this.startOrRestartTimeout(newTimeoutMs || this.timeoutMs);
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
