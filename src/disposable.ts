export type DisposableLike = Disposable | Disposable[] | undefined;

export namespace Disposable {
	export function create(
		disposable?: DisposableLike | (() => void)
	): Disposable {
		if (!disposable) return empty;
		if (disposable instanceof Function) return { dispose: disposable };
		if ("dispose" in disposable) return disposable as Disposable;
		else return { dispose: () => dispose(disposable) };
	}
	export const empty: Disposable = { dispose: () => {} };
}

export interface Disposable {
	dispose(): void;
}

function isPromise(obj: any): obj is Promise<unknown> {
	return (
		!!obj &&
		(typeof obj === "object" || typeof obj === "function") &&
		typeof (obj as any).then === "function"
	);
}

export function disposeOnReturn<T>(
	callback: (track: (...disposables: Disposable[]) => void) => T
): T {
	let wasPromise = false;
	const items: Disposable[] = [];
	try {
		const result = callback((...args) => items.push(...args));
		if (isPromise(result)) {
			wasPromise = true;

			return (async function test() {
				try {
					return await result;
				} finally {
					dispose(items);
				}
			})() as any;
		}

		return result;
	} finally {
		if (!wasPromise) {
			dispose(items);
		}
	}
}

export function dispose(disposable: Disposable | Disposable[] | undefined) {
	if (!disposable) return;

	if (Array.isArray(disposable)) {
		for (var d of disposable) d.dispose();
	} else {
		disposable.dispose();
	}
}

export abstract class DisposableComponent implements Disposable {
	private disposables: Disposable[] = [];

	protected addDisposable(disposable: Disposable) {
		this.disposables.push(disposable);
	}

	public dispose() {
		dispose(this.disposables);
	}
}
