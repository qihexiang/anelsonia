import { Fn } from "./createWrapper";

/**
 * Wrap a function to make it do not be called too many times.
 *
 * If it called too many times, wrapped function will return a
 * fallback value without too many computation.
 *
 * @param fn function to be wrapped.
 * @param options specify maximum times to be called in a windowSize, and set the fallback value.
 * @returns
 */
export function limitRate<F extends Fn>(
    fn: F,
    options: { max: number; windowSize: number; fallback: ReturnType<F> }
): F {
    let count = 0;
    setInterval(() => {
        const rest = count - options.max;
        count = rest >= 0 ? rest : 0;
    }, options.windowSize);
    return ((...args) => {
        if (count < options.max) {
            count += 1;
            return fn(...args);
        } else {
            return options.fallback;
        }
    }) as F;
}
