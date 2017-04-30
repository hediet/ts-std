export function createDisposable(disposable?: (() => void) | IDisposable | IDisposable[] | undefined): IDisposable {
	if (!disposable) return { dispose: () => undefined };
	if (disposable instanceof Function) return { dispose: disposable };
	if ("dispose" in disposable) return disposable as IDisposable;
	else return { dispose: () => dispose(disposable) };
} 

export interface IDisposable {
	dispose(): void;
}

export function limitLifeTime<T>(callback: (mortals: IDisposable[]) => T): T {
	const mortals: IDisposable[] = [];
	try {
		const result = callback(mortals);
		return result;
	}
	finally {
		dispose(mortals);
	}
}

export function dispose(disposable: IDisposable | IDisposable[] | undefined) {
	if (!disposable) return;

	if (Array.isArray(disposable)) {
		for (var d of disposable)
			d.dispose();
	}
	else {
		disposable.dispose();
	}
}

export const emptyDisposable: IDisposable = { dispose: () => {} };

export abstract class Disposable implements IDisposable {
	private disposables: IDisposable[] = [];
	
	protected addDisposable(disposable: IDisposable) {
		this.disposables.push(disposable);
	}

	public dispose() {
		dispose(this.disposables);
	}
}