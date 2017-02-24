
class Barrier<T> {
	public unlock: (value: T) => void;
	public reject: (reason: string) => void;
	
	public readonly onUnlocked: Promise<T> = new Promise((resolve, reject) => { this.unlock = resolve; this.reject = reject; });
}
