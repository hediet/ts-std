export class Wrapper {}

export class ResultWrapper<TResult> extends Wrapper {
	constructor(public readonly value: TResult) { super(); }
}

export class ErrorWrapper<TError> extends Wrapper {
	constructor(public readonly value: TError) { super(); }
}

export type Maybe<TResult, TError> = ResultWrapper<TResult> | ErrorWrapper<TError>;

export function isResult<TResult, TError>(maybe: Maybe<TResult, TError>): maybe is ResultWrapper<TResult> {
	return maybe instanceof ResultWrapper;
}

export function isError<TResult, TError>(maybe: Maybe<TResult, TError>): maybe is ErrorWrapper<TError> {
	return maybe instanceof ErrorWrapper;
}

export function result<TResult>(value: TResult): ResultWrapper<TResult> {
	return new ResultWrapper<TResult>(value);
}

export function error(): ErrorWrapper<void>;
export function error<TError>(value: TError): ErrorWrapper<TError>;
export function error<TError>(value?: TError): ErrorWrapper<TError|void> {
	return new ErrorWrapper<TError|void>(value);
}