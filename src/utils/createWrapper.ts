import { MaybePromise } from "./MaybePromise.ts";

/**
 * Basic type of all functions
 */
// deno-lint-ignore no-explicit-any
export type Fn = (...args: any[]) => any;
/**
 * Basic type of asynchorous functions
 */
// deno-lint-ignore no-explicit-any
export type AsyncFn = (...args: any[]) => Promise<any>;

/**
 * The tuple that should be return be `createWrapper` hook.
 */
export type BeforeHookTuple<O extends Fn | AsyncFn, T extends Fn | AsyncFn> =
    | [Parameters<O>, (r: ReturnType<O>) => ReturnType<T>]
    | [Parameters<O>]
    | [null, () => ReturnType<T>];

/**
 * A function that just return the given value
 *
 * @param value the value pass to the function
 * @returns the value passed to the function
 */
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
    hook: (...args: Parameters<T>) => BeforeHookTuple<O, T>,
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
    hook: (...args: Parameters<T>) => Promise<BeforeHookTuple<O, T>>,
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
    hook: (...args: Parameters<T>) => Promise<BeforeHookTuple<O, T>>,
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
    hook: (...args: Parameters<T>) => BeforeHookTuple<O, T>,
): (fn: O) => (...args: Parameters<T>) => ReturnType<T>;
export function createWrapper<
    O extends Fn | AsyncFn,
    T extends Fn | AsyncFn = O,
>(
    hook: (...args: Parameters<T>) => MaybePromise<BeforeHookTuple<O, T>>,
): (fn: O) => (...args: Parameters<T>) => ReturnType<T> {
    return (fn) =>
        (...args) => {
            const t = hook(...args);
            if (t instanceof Promise) {
                return t.then(([p, after]) => {
                    if (p === null) return (after as () => ReturnType<T>)();
                    return (after ?? echo)(fn(...p));
                });
            }
            const [p, after] = t;
            if (p === null) return (after as () => ReturnType<T>)();
            return (after ?? echo)(fn(...p));
        };
}

/**
 * createEffect can add hooks execute before and after original function,
 * and hooks wouldn't change arguments and return value of original
 * function, but can perform some side effect, like logging.
 * @param hook a function execute before original function, and return a
 * function execute after original function.
 * @returns a wrapper that can wrap the orignal function to another function
 * with side effect.
 */
// deno-lint-ignore no-explicit-any
export function createEffect<F extends (...args: any[]) => any>(
    hook: (
        ...args: Readonly<Parameters<F>>
    ) => (r: Readonly<ReturnType<F>>) => void,
): (
    fn: (...args: Parameters<F>) => ReturnType<F>,
) => (...args: Parameters<F>) => ReturnType<F> {
    return (fn) =>
        (...p) => {
            const hookAfter = hook(...p);
            const r = fn(...p);
            hookAfter(r);
            return r;
        };
}

/**
 * Create a effect for any function, the hook is not related to the
 * parameters and return value of the origin function.
 *
 * @param hook a function include code executed before the original
 * function and returns the code executed after the original function
 * @returns a function that can wrap another function.
 */
export function createEffect4Any(hook: () => () => void) {
    return <F extends Fn>(fn: F): ((...args: Parameters<F>) => ReturnType<F>) =>
        (...args: Parameters<F>) => {
            const hookAfter = hook();
            const r = fn(...args);
            hookAfter();
            return r as ReturnType<F>;
        };
}
