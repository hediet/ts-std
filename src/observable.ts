import { EventSource, EventEmitter } from "./events";

export abstract class Observable<T> {
	abstract get value(): T;
	abstract get onChange(): EventSource<
		{ newValue: T; oldValue: T },
		Observable<T>
	>;

	public waitForValue(): Promise<T extends undefined | null ? never : T> {
		return new Promise((res, rej) => {
			const d = this.onChange.sub(({ newValue }) => {
				if (newValue !== null && newValue !== undefined) {
					d.dispose();
					res(newValue as any);
				}
			});
		});
	}
}

/*
export class ComputedObservable<T> extends Observable<T> {
	private readonly primitiveObservable = new PrimitiveObservable<T>(() => this.compute());

	constructor(dependencies: ) {
		super();
	}
}
*/

export class PrimitiveObservable<T> extends Observable<T> {
	private initialized: boolean = false;
	private _value!: T;
	private changeEmitter = new EventEmitter<
		{ newValue: T; oldValue: T },
		Observable<T>
	>();

	public onChange = this.changeEmitter.asEvent();

	constructor(private readonly initialValue: () => T) {
		super();
	}

	private initialize() {
		if (!this.initialized) {
			this._value = this.initialValue();
			this.initialized = true;
		}
	}

	public get value(): T {
		this.initialize();
		return this._value;
	}

	public setValue(newValue: T) {
		this.initialize();
		if (newValue !== this._value) {
			const oldValue = this._value;
			this._value = newValue;
			this.changeEmitter.emit({ newValue, oldValue }, this);
		}
	}

	public asObservable(): Observable<T> {
		return this;
	}
}
