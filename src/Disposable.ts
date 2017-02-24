
export function disposable(dispose: () => void): IDisposable {
	return { dispose: dispose };
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

export function dispose(disposable: IDisposable|IDisposable[]|undefined) {
	if (!disposable) return;

	if (Array.isArray(disposable)) {
		for (var d of disposable)
			d.dispose();
	}
	else {
		disposable.dispose();
	}
}