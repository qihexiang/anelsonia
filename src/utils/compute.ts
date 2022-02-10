import { baseCompose } from ".";

export interface Computation<T> {
    map: <R>(fn: (t: T) => R) => Computation<R>;
    get value(): T;
}

/**
 * Compute a value in a chain.
 * 
 * @param initValue The initial value
 * @returns Computation<T>
 */
export const compute = <T>(initValue: T): Computation<T> => {
    return {
        map: fn => compute(fn(initValue)),
        get value() { return initValue; }
    };
};

export default compute;

interface Lazy<F extends () => any> {
    map: <N>(nextFn: ((r: ReturnType<F>) => N)) => Lazy<() => N>;
    get value(): ReturnType<F>;
}

const lazy = <F extends () => any>(fn: F): Lazy<F> => {
    return {
        map: nextFn => lazy(baseCompose<void, ReturnType<F>, ReturnType<typeof nextFn>>(fn, nextFn)),
        get value() {
            return fn();
        }
    };
};

export const computeLazy = <T>(initValue: T): Lazy<() => T> => {
    return lazy(() => initValue);
};
