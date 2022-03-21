import { isVoid } from "./isVoid.ts";
import { MaybePromise } from "./MaybePromise.ts";

// deno-lint-ignore no-explicit-any
export type Fn = (...args: any[]) => any;
// deno-lint-ignore no-explicit-any
export type AsyncFn = (...args: any[]) => Promise<any>;
export type BeforeHookTuple<Origin extends Fn, Target extends Fn> = [
    Parameters<Origin>,
    (result: ReturnType<Origin>) => ReturnType<Target>,
] | [null, () => ReturnType<Target>];

export function createProxy<F extends AsyncFn>(
    hook: (
        ...args: Parameters<F>
    ) => MaybePromise<BeforeHookTuple<F, F>>
): (fn: F) => (...args: Parameters<F>) => ReturnType<F>;
export function createProxy<F extends Fn>(
    hook: (
        ...args: Parameters<F>
    ) => BeforeHookTuple<F, F>
): (fn: F) => (...args: Parameters<F>) => ReturnType<F>;
export function createProxy<Origin extends Fn, Target extends Fn>(
    hook: (
        ...args: Parameters<Target>
    ) =>
        (Origin extends AsyncFn
            ? (Target extends AsyncFn
                ? MaybePromise<BeforeHookTuple<Origin, Target>>
                : never)
            : (Target extends AsyncFn
                ? MaybePromise<BeforeHookTuple<Origin, Target>>
                : BeforeHookTuple<Origin, Target>)),
): (fn: Origin) => (...args: Parameters<Target>) => ReturnType<Target>;
export function createProxy<Origin extends Fn, Target extends Fn>(
    hook: (
        ...args: Parameters<Target>
    ) => MaybePromise<BeforeHookTuple<Origin, Target>>,
): (fn: Origin) => (...args: Parameters<Target>) => ReturnType<Target> {
    return (fn) =>
        (...args) => {
            const mayPromiseTuple = hook(...args);
            if (mayPromiseTuple instanceof Promise) {
                const promiseTuple = mayPromiseTuple;
                return promiseTuple.then(([originArgs, afterHook]) =>
                    isVoid(originArgs)
                        ? (afterHook as () => ReturnType<Target>)()
                        : afterHook(fn(...originArgs))
                ) as ReturnType<Target>;
            } else {
                const tuple = mayPromiseTuple;
                const [originArgs, afterHook] = tuple;
                return isVoid(originArgs)
                    ? (afterHook as () => ReturnType<Target>)()
                    : afterHook(fn(...originArgs));
            }
        };
}

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
 * @deprecated will be removed in 2.0.0, use `createProxy` instead.
 * 
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
 * @deprecated will be removed in 2.0.0, use `createProxy` instead.
 * 
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
 * @deprecated will be removed in 2.0.0, use `createProxy` instead.
 * 
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
 * @deprecated will be removed in 2.0.0, use `createProxy` instead.
 * 
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
                    return after(fn(...p));
                }) as ReturnType<T>;
            }
            const [p, after] = t;
            if (p === null) return (after as () => ReturnType<T>)();
            return after(fn(...p));
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
