export interface Disposable {
	dispose(): void;
}

export type DisposableLike =
	| Disposable
	| ReadonlyArray<Disposable>
	| Set<Disposable>
	| undefined
	| void;

export namespace Disposable {
	export function create(
		disposable?: DisposableLike | (() => void)
	): Disposable {
		if (!disposable) return empty;
		if (disposable instanceof Function) return { dispose: disposable };
		if ("dispose" in disposable) return disposable as Disposable;
		else if (disposable instanceof Set)
			return new ArrayDisposer([...disposable]);
		else if (disposable.length > 0) return new ArrayDisposer(disposable);

		return empty;
	}
	export const empty: Disposable = { dispose: () => {} };

	export function normalize(
		disposable: DisposableLike
	): ReadonlyArray<Disposable> {
		if (!disposable) return [];
		if (disposable instanceof ArrayDisposer) return disposable.items;
		if ("dispose" in disposable) return [disposable as Disposable];
		if (disposable instanceof Set) return [...disposable];
		else return disposable;
	}
}

class ArrayDisposer implements Disposable {
	constructor(public readonly items: ReadonlyArray<Disposable>) {}

	dispose() {
		dispose(this.items);
	}
}

// See https://github.com/Microsoft/TypeScript/issues/17002
function isArray(item: any): item is ReadonlyArray<any> {
	return Array.isArray(item);
}

export function dispose(disposable: DisposableLike) {
	if (!disposable) return;

	if (isArray(disposable) || disposable instanceof Set) {
		for (var d of disposable) {
			d.dispose();
		}
	} else {
		disposable.dispose();
	}
}

export type TrackFunction = <T extends DisposableLike>(disposable: T) => T;

export class DisposableComponent implements Disposable {
	private disposables = new Set<Disposable>();

	constructor(
		callback?: (track: TrackFunction, untrack: TrackFunction) => void
	) {
		if (callback) {
			callback(
				disposable => this.trackDisposable(disposable),
				disposable => this.untrackDisposable(disposable)
			);
		}
	}

	protected trackDisposable<T extends DisposableLike>(disposable: T): T {
		for (const d of Disposable.normalize(disposable)) {
			this.disposables.add(d);
		}
		return disposable;
	}

	protected untrackDisposable<T extends DisposableLike>(disposable: T): T {
		for (const d of Disposable.normalize(disposable)) {
			this.disposables.delete(d);
		}
		return disposable;
	}

	public dispose() {
		dispose(this.disposables);
	}
}

export function disposeOnReturn<T>(
	callback: (track: TrackFunction, untrack: TrackFunction) => T
): T {
	let wasPromise = false;
	const disposables = new Set<Disposable>();
	try {
		const result = callback(
			disposable => {
				for (const d of Disposable.normalize(disposable)) {
					disposables.add(d);
				}
				return disposable;
			},
			disposable => {
				for (const d of Disposable.normalize(disposable)) {
					disposables.delete(d);
				}
				return disposable;
			}
		);
		if (isPromise(result)) {
			wasPromise = true;

			return (async function test() {
				try {
					return await result;
				} finally {
					dispose(disposables);
				}
			})() as any;
		}

		return result;
	} finally {
		if (!wasPromise) {
			dispose(disposables);
		}
	}
}

function isPromise(obj: any): obj is Promise<unknown> {
	return (
		!!obj &&
		(typeof obj === "object" || typeof obj === "function") &&
		typeof (obj as any).then === "function"
	);
}
