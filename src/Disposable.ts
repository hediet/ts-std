
export function disposable(dispose: () => void): Disposable {
	return { dispose: dispose };
} 

export interface Disposable {
	dispose(): void;
}

export function limitLifeTime<T>(callback: (mortals: Disposable[]) => T): T {
	const mortals: Disposable[] = [];
	try {
		const result = callback(mortals);
		return result;
	}
	finally {
		dispose(mortals);
	}
}

export function dispose(disposable: Disposable|Disposable[]|undefined) {
	if (!disposable) return;

	if (Array.isArray(disposable)) {
		for (var d of disposable)
			d.dispose();
	}
	else {
		disposable.dispose();
	}
}