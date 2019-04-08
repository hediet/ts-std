export class AttachedProperty<TTarget extends object, TValue> {
	private readonly sym = Symbol();

	constructor(private readonly defaultValueCtor: () => TValue) {}

	public get(target: TTarget): TValue {
		if (!(this.sym in target)) {
			(target as any)[this.sym] = this.defaultValueCtor();
		}
		return (target as any)[this.sym];
	}

	public set(target: TTarget, value: TValue) {
		(target as any)[this.sym] = value;
	}
}
