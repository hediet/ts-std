//import { CancellationToken, CancellationError } from './cancellation';
import { Disposable } from "./disposable";
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

export type EventTimerState = "started" | "stopped";

export class EventTimer {
	protected emitter = new EventEmitter<undefined, EventTimer>();
	public readonly onTick = this.emitter.asEvent();
	private activeInterval: Disposable | undefined;

	public get state(): EventTimerState {
		if (this.activeInterval) {
			return "started";
		} else {
			return "stopped";
		}
	}

	constructor(
		private readonly intervalMs: number,
		initialState: EventTimerState
	) {
		if (initialState === "started") {
			this.start();
		}
	}

	public startImmediate(): boolean {
		if (this.start()) {
			this.emitter.emit(undefined, this);
			return true;
		}
		return false;
	}

	public start(): boolean {
		if (!this.activeInterval) {
			this.activeInterval = startInterval(this.intervalMs, () =>
				this.emitter.emit(undefined, this)
			);
			return true;
		}
		return false;
	}

	public stop(): boolean {
		if (this.activeInterval) {
			this.activeInterval.dispose();
			this.activeInterval = undefined;
			return true;
		}
		return false;
	}

	public dispose() {
		stop();
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
