import { IDisposable, disposable } from './Disposable';

/**
 * Event handler function with a generic sender and a generic argument.
 */
export type EventHandler<TSender, TArgs> = (sender: TSender, args: TArgs) => void;

/**
 * Event handler function with a generic argument
 */
export type SimpleEventHandler<TArgs> = (args: TArgs) => void;

/**
 * Event handler function without arguments
 */
export type SignalHandler = () => void;

/**
 * Indicates the object implements generic subscriptions. 
 */
export interface ISubscribable<THandlerType> {

	/** 
	 * Subscribe to the event.
	 * @param fn The event handler that is called when the event is dispatched.
	 */
	sub(fn: THandlerType): IDisposable;

	/**
	 * Subscribes to the event only once.
	 * @param fn The event handler that will be unsubsribed from the event.
	 */
	one(fn: THandlerType): IDisposable;
}

export function waitOne(event: ISubscribable<SignalHandler>): Promise<void>;
export function waitOne<TArgs>(event: ISubscribable<SimpleEventHandler<TArgs>>): Promise<TArgs>;
export function waitOne<TArgs>(event: ISubscribable<EventHandler<any, TArgs>>): Promise<TArgs> {
	return new Promise(resolve => event.one(resolve));
}

/**
 * Models an event with a generic sender and generic argument.
 */
export interface IEvent<TSender, TArgs> extends ISubscribable<EventHandler<TSender, TArgs>> {}

/** 
 * Models a simple event with a generic argument.
 */
export interface ISimpleEvent<TArgs> extends ISubscribable<SimpleEventHandler<TArgs>> {}

/**
 * Models a signal. This type of events has no arguments.
 */
export interface ISignal extends ISubscribable<SignalHandler> {}

/**
 * Base class for implementation of the dispatcher. It facilitates the subscribe
 * and unsubscribe methods based on generic handlers. The TEventType specifies
 * the type of event that should be exposed. Use the asEvent to expose the
 * dispatcher as event.
 */
/**
 * Stores a handler. Manages execution meta data.
 * @class Subscription
 * @template TEventHandler
 */
export class Subscription<TEventHandler> {
	/**
	 * Creates an instance of Subscription.
	 * 
	 * @param {TEventHandler} handler The handler for the subscription.
	 * @param {boolean} isOnce Indicates if the handler should only be executed` once.
	 */
	constructor(public handler: TEventHandler, public readonly isOnce: boolean) {
	}

	/**
	 * Executes the handler.
	 * 
	 * @param {boolean} executeAsync True if the even should be executed async.
	 * @param {*} The scope the scope of the event.
	 * @param {IArguments} args The arguments for the event.
	 */
	public execute(scope: any, args: IArguments) {
		var fn: any = this.handler;
		fn.apply(scope, args);
	}
}

export abstract class EmitterBase<TEventHandler> implements ISubscribable<TEventHandler> {

	private readonly wrap = new EmitterWrapper(this);
	private readonly subscriptions = new Set<Subscription<TEventHandler>>();

	/**
	 * Subscribe to the event dispatcher.
	 * @param fn The event handler that is called when the event is dispatched.
	 */
	public sub(fn: TEventHandler): IDisposable {
		const sub = new Subscription<TEventHandler>(fn, false);
		this.subscriptions.add(sub);
		return disposable(() => this.subscriptions.delete(sub));
	}

	/** 
	 * Subscribe once to the event with the specified name.
	 * @param fn The event handler that is called when the event is dispatched.
	 */
	public one(fn: TEventHandler): IDisposable {
		const sub = new Subscription<TEventHandler>(fn, true);
		this.subscriptions.add(sub);
		return disposable(() => this.subscriptions.delete(sub));
	}

	/**
	 * Generic dispatch will dispatch the handlers with the given arguments. 
	 * 
	 * @protected
	 * @param {*} The scope the scope of the event.
	 * @param {IArguments} args The arguments for the event.
	 */
	protected _dispatch(scope: any, args: IArguments) {

		for (const sub of this.subscriptions.values()) {
			if (sub.isOnce)
				this.subscriptions.delete(sub);
			sub.execute(scope, args);
		}
	}

	/**
	 * Creates an event from the dispatcher. Will return the dispatcher
	 * in a wrapper. This will prevent exposure of any dispatcher methods.
	 */
	public asEvent(): ISubscribable<TEventHandler> { return this.wrap; }
}

/**
 * Dispatcher implementation for events. Can be used to subscribe, unsubscribe
 * or dispatch events. Use the ToEvent() method to expose the event.
 */
export class EventEmitter<TSender, TArgs> extends EmitterBase<EventHandler<TSender, TArgs>> implements IEvent<TSender, TArgs>
{
	/**
	 * Dispatches the event.
	 * @param sender The sender.
	 * @param args The arguments object.
	 */
	public dispatch(sender: TSender, args: TArgs) { this._dispatch(this, arguments); }
}

/**
 * The dispatcher handles the storage of subsciptions and facilitates
 * subscription, unsubscription and dispatching of a simple event 
 */
export class SimpleEventEmitter<TArgs> extends EmitterBase<SimpleEventHandler<TArgs>> implements ISimpleEvent<TArgs>
{
	/**
	 * Dispatches the event.
	 * @param args The arguments object.
	 */
	public dispatch(args: TArgs) { this._dispatch(this, arguments); }
}

/**
 * The dispatcher handles the storage of subsciptions and facilitates
 * subscription, unsubscription and dispatching of a signal event. 
 */
export class SignalEmitter extends EmitterBase<SignalHandler> implements ISignal {
	/**
	 * Dispatches the signal.
	 */
	public dispatch() { this._dispatch(this, arguments); }
}

/**
 * Hides the implementation of the event dispatcher. Will expose methods that
 * are relevent to the event.
 */
export class EmitterWrapper<TEventHandler> implements ISubscribable<TEventHandler>
{
	private readonly __dispatcher: ISubscribable<TEventHandler>;

	/**
	 * Creates a new EventDispatcherWrapper instance.
	 * @param dispatcher The dispatcher.
	 */
	constructor(dispatcher: ISubscribable<TEventHandler>) { this.__dispatcher = dispatcher; }

	/**
	 * Subscribe to the event dispatcher.
	 * @param fn The event handler that is called when the event is dispatched.
	 */
	public sub(fn: TEventHandler): IDisposable { return this.__dispatcher.sub(fn); }

	/** 
	 * Subscribe once to the event with the specified name.
	 * @param fn The event handler that is called when the event is dispatched.
	 */
	public one(fn: TEventHandler): IDisposable { return this.__dispatcher.one(fn); }
}
