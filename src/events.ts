import { Disposable } from "./disposable";

export type EventHandler<TArgs, TSender> = (
	sender: TSender,
	args: TArgs
) => void;

export abstract class EventSource<TArgs = void, TSender = unknown> {
	public abstract sub(fn: EventHandler<TArgs, TSender>): Disposable;
	public abstract one(fn: EventHandler<TArgs, TSender>): Disposable;

	public waitOne<TArgs>(event: EventSource<unknown, TArgs>): Promise<TArgs> {
		return new Promise(resolve => event.one(resolve));
	}
}

interface Subscription<TArgs, TSender> {
	readonly handler: EventHandler<TArgs, TSender>;
	readonly isOnce: boolean;
}

export class EventEmitter<TArgs = void, TSender = unknown> extends EventSource<
	TArgs,
	TSender
> {
	private readonly subscriptions = new Set<Subscription<TArgs, TSender>>();

	public sub(fn: EventHandler<TArgs, TSender>): Disposable {
		const sub: Subscription<TArgs, TSender> = {
			handler: fn,
			isOnce: false,
		};
		this.subscriptions.add(sub);
		return Disposable.create(() => this.subscriptions.delete(sub));
	}

	public one(fn: EventHandler<TArgs, TSender>): Disposable {
		const sub: Subscription<TArgs, TSender> = {
			handler: fn,
			isOnce: false,
		};
		this.subscriptions.add(sub);
		return Disposable.create(() => this.subscriptions.delete(sub));
	}

	public asEvent(): EventSource<TArgs, TSender> {
		return this;
	}

	public emit(args: TArgs, sender: TSender) {
		for (const sub of this.subscriptions.values()) {
			if (sub.isOnce) this.subscriptions.delete(sub);
			sub.handler(sender, args);
		}
	}
}
