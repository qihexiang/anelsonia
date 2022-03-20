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
export function createProxy<Origin extends Fn, Target extends Fn = Origin>(
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
