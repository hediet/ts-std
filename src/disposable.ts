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

export async function guaranteeDisposeAsync<T>(
	callback: (items: Disposable[]) => Promise<T>
): Promise<T> {
	const items: Disposable[] = [];
	try {
		const result = await callback(items);
		return result;
	} finally {
		dispose(items);
	}
}

export function guaranteeDispose<T>(callback: (items: Disposable[]) => T): T {
	const items: Disposable[] = [];
	try {
		const result = callback(items);
		return result;
	} finally {
		dispose(items);
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
