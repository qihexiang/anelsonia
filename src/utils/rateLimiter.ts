import { Fn } from "./createWrapper";

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
