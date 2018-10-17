type _T<__T> = __T;

type SuccessOrFailure<T, E = any> = Success<T, E> | Failure<T, E>;
interface BaseSuccessOrFailure<T, E> {
    status: 'resolved' | 'rejected';
    assertValue: T;
    resolved(): this is Success<T, E>;
    rejected(): this is Failure<any, any>;
}
class Success<T, E> implements BaseSuccessOrFailure<T, E> {
    constructor(public readonly value: T) { }
    status: 'resolved';
    assertValue: T;
    catch(...args: any[]) {return this}
    resolved(): this is Success<T, E> { return true };
    rejected(): this is Failure<any, any> { return false };
}
Success.prototype.status === 'resolved';
class Failure<T, E> implements BaseSuccessOrFailure<T, E> {
    constructor(public readonly error: E) { }
    status: 'rejected';
    assertValue: T;
    catch(...args: any[]) {
        // TODO return a version of this that wraps the new error, minus the filtered errors,
        // plus the new return value (if not void)
    }
    resolved(): this is Success<T, E> { return false };
    rejected(): this is Failure<T, E> { return true };
}
Failure.prototype.status = 'rejected';

function isPromise(p: any): p is Promise<any> {
    return p && typeof p.then === 'function'; 
}
async function attempt<T, E>(p: Promise<T> | (() => Promise<T> | T)): _T<Promise<_T<Success<T, E> | Failure<T, E>>>> {
    try {
        if (isPromise(p)) {
            return new Success(await p);
        } else {
            return new Success(await p());
        } 
    } catch (e) {
        return new Failure<T, E>(e);
    }
}

async function asyncOperation() {
    return { foo: 123, bar: 'this is bar' };
}

function syncOperation() {
    return { foo: 123, bar: 'this is bar' };
}

async function main() {
    const _t = await attempt(() => syncOperation());
    if (_t.rejected()) {
        throw _t.error;
    }
    const { bar, foo } = _t.value;
}

/*
 * attempt() always resolves, but resolution might wrap an error, not a value.
 *
 * attempt().catch() allows catching errors by type and throwing new errors
 * ...or catching an error and returning a new kind of result.
 * 
 * attempt().assertValue will synchronously throw any error and return the value
 * Only available on synchronous variant of attempt() or on unwrapped result
 * 
 * Some error actions cannot be wrapped within a function (for example, return, continue, or break statements)
 */

function foo() {
    throw 123;
}
