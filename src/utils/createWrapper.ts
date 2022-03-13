import MaybePromise from "./MaybePromise.js";

export type Fn = (...args: any[]) => any;
export type AsyncFn = (...args: any[]) => Promise<any>;

export type BeforeHookTuple<O extends Fn | AsyncFn, T extends Fn | AsyncFn> =
    | [Parameters<O>, (r: ReturnType<O>) => ReturnType<T>]
    | [Parameters<O>]
    | [null, () => ReturnType<T>];

export function echo<T>(value: T): T {
    return value;
}

/**
 * Add hooks to a synchronous original function, while the beforeHook is
 * synchrous too. The default type of target function is the same as
 * original function.
 *
 * @param hook a synchronous function executed before original function,
 * returns parameters and a hook executed after the original function.
 */
export function createWrapper<O extends Fn, T extends Fn | AsyncFn = O>(
    hook: (...args: Parameters<T>) => BeforeHookTuple<O, T>
): (fn: O) => (...args: Parameters<T>) => ReturnType<T>;
/**
 * Add hooks to a synchronous original function, while the beforeHook is
 * asynchronous. The target function is a asynchronous function, which is
 * different from the original one, so you need to declare it.
 *
 * @param hook an asynchronous function executed before original function,
 * returns parameters and a hook executed after the original function.
 */
export function createWrapper<O extends Fn, T extends AsyncFn>(
    hook: (...args: Parameters<T>) => Promise<BeforeHookTuple<O, T>>
): (fn: O) => (...args: Parameters<T>) => ReturnType<T>;
/**
 * Add hooks to an asynchronous original function, while the beforeHook is
 * asynchronous too. The default type of target function is the same as the
 * original function.
 *
 * @param hook an asynchronous function executed before original function,
 * returns parameters and a hook executed after the original function.
 */
export function createWrapper<O extends AsyncFn, T extends AsyncFn = O>(
    hook: (...args: Parameters<T>) => Promise<BeforeHookTuple<O, T>>
): (fn: O) => (...args: Parameters<T>) => ReturnType<T>;
/**
 * Add hooks to an asynchronous original function, while the beforeHook is
 * synchronous. The default type of target function is the same as the
 * original function.
 *
 * @param hook an asynchronous function executed before original function,
 * returns parameters and a hook executed after the original function.
 */
export function createWrapper<O extends AsyncFn, T extends AsyncFn = O>(
    hook: (...args: Parameters<T>) => BeforeHookTuple<O, T>
): (fn: O) => (...args: Parameters<T>) => ReturnType<T>;
export function createWrapper<
    O extends Fn | AsyncFn,
    T extends Fn | AsyncFn = O
>(
    hook: (...args: Parameters<T>) => MaybePromise<BeforeHookTuple<O, T>>
): (fn: O) => (...args: Parameters<T>) => ReturnType<T> {
    return (fn) =>
        (...args) => {
            const t = hook(...args);
            if (t instanceof Promise)
                return t.then(([p, after]) => {
                    if (p === null) return (after as () => ReturnType<T>)();
                    return (after ?? echo)(fn(...p));
                });
            const [p, after] = t;
            if (p === null) return (after as () => ReturnType<T>)();
            return (after ?? echo)(fn(...p));
        };
}

export default createWrapper;

export function addWrapper<
    F extends Fn | AsyncFn,
    P extends unknown[] = Parameters<F>,
    R = ReturnType<F>
>(fn: F, hook: (...args: P) => BeforeHookTuple<F, (...args: P) => R>) {
    return createWrapper(hook)(fn);
}
