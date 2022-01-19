/**
 * createEffect can add hooks execute before and after original function,
 * and hooks wouldn't change arguments and return value of original
 * function, but can perform some side effect, like logging.
 * @param hook a function execute before original function, and return a
 * function execute after original function.
 * @returns a wrapper that can wrap the orignal function to another function
 * with side effect.
 */
export function createEffect<F extends (...args: any) => any>(hook: (...args: Parameters<F>) => (r: Readonly<ReturnType<F>>) => void): (fn: (...args: Parameters<F>) => ReturnType<F>) => (...args: Parameters<F>) => ReturnType<F> {
    return fn => (...p) => {
        const hookAfter = hook(...p);
        const r = fn(...p);
        hookAfter(r);
        return r;
    };
}

export default createEffect;
