import { isVoid } from "./isVoid.js";
import { MaybePromise } from "./MaybePromise.js";

export type Fn = (...args: any[]) => any;
export type AsyncFn = (...args: any[]) => Promise<any>;
export type BeforeHookTuple<Origin extends Fn, Target extends Fn> =
    | [Parameters<Origin>, (result: ReturnType<Origin>) => ReturnType<Target>]
    | [null, () => ReturnType<Target>];

export function createProxy<F extends AsyncFn>(
    hook: (...args: Parameters<F>) => MaybePromise<BeforeHookTuple<F, F>>
): (fn: F) => F;
export function createProxy<F extends Fn>(
    hook: (...args: Parameters<F>) => BeforeHookTuple<F, F>
): (fn: F) => F;
export function createProxy<Origin extends Fn, Target extends Fn>(
    hook: (
        ...args: Parameters<Target>
    ) => Origin extends AsyncFn
        ? Target extends AsyncFn
            ? MaybePromise<BeforeHookTuple<Origin, Target>>
            : never
        : Target extends AsyncFn
        ? MaybePromise<BeforeHookTuple<Origin, Target>>
        : BeforeHookTuple<Origin, Target>
): (fn: Origin) => Target;
export function createProxy<Origin extends Fn, Target extends Fn>(
    hook: (
        ...args: Parameters<Target>
    ) => MaybePromise<BeforeHookTuple<Origin, Target>>
): (fn: Origin) => Target {
    return (fn) =>
        ((...args: Parameters<Target>) => {
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
        }) as Target;
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
 * Wrap a value into a Promise
 *
 * @param value the value to be wrapped
 * @returns a Promisified value
 */
export function asyncEcho<T>(value: T): Promise<T> {
    return Promise.resolve(value);
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
export function createEffect<F extends Fn>(
    hook: (
        ...args: Readonly<Parameters<F>>
    ) => (r: Readonly<ReturnType<F>>) => void
): (fn: (...args: Parameters<F>) => ReturnType<F>) => F {
    return (fn) =>
        ((...p: Parameters<F>) => {
            const hookAfter = hook(...p);
            const r = fn(...p);
            hookAfter(r);
            return r;
        }) as F;
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
        ((...args: Parameters<F>) => {
            const hookAfter = hook();
            const r = fn(...args);
            hookAfter();
            return r as ReturnType<F>;
        }) as F;
}
