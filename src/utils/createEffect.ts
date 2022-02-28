import { Fn } from "./createWrapper";

/**
 * createEffect can add hooks execute before and after original function,
 * and hooks wouldn't change arguments and return value of original
 * function, but can perform some side effect, like logging.
 * @param hook a function execute before original function, and return a
 * function execute after original function.
 * @returns a wrapper that can wrap the orignal function to another function
 * with side effect.
 */
export function createEffect<F extends (...args: any[]) => any>(
    hook: (
        ...args: Readonly<Parameters<F>>
    ) => (r: Readonly<ReturnType<F>>) => void
): (
    fn: (...args: Parameters<F>) => ReturnType<F>
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

export function addEffect<F extends (...args: any[]) => any>(
    fn: F,
    hook: (
        ...args: Readonly<Parameters<F>>
    ) => (r: Readonly<ReturnType<F>>) => void
) {
    return createEffect(hook)(fn);
}

export default createEffect;
