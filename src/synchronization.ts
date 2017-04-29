export class Barrier<T> {
	public unlock: (value: T) => void;
	public reject: (reason: string) => void;

	public readonly onUnlocked: Promise<T> = new Promise((resolve, reject) => { this.unlock = resolve; this.reject = reject; });
}

export class Deferred<T> {
	public setValue: (value: T) => void;
	public reject: (reason: string) => void;

	public readonly value: Promise<T> = new Promise((resolve, reject) => { this.setValue = resolve; this.reject = reject; });
}

export class ProducerConsumer<T> {
	private barriers: Deferred<T>[] = [];
	private nextBarriers: Deferred<T>[] = [];

	private popOrNext(): Deferred<T> {
		let b = this.barriers.shift();
		if (!b) {
			b = new Deferred<T>();
			this.nextBarriers.push(b);
		}
		return b;
	}

	public produce(value: T) { this.popOrNext().setValue(value); }

	public rejectSingle(reason: string) { this.popOrNext().reject(reason); }

	public consume(): Promise<T> {
		let b = this.nextBarriers.shift();
		if (!b) {
			b = new Deferred<T>();
			this.barriers.push(b);
		}
		return b.value;
	}
}