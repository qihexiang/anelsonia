import { baseCompose } from "./composeFn";
import { isVoid } from "./isVoid";

export interface Computation<T> {
    readonly map: <R>(fn: (t: T) => R) => Computation<R>;
    readonly mapSkipNull: <R>(
        nextFn: (r: NonNullable<T>) => R
    ) => Computation<R | Extract<T, undefined | null>>;
    readonly ifNull: (
        nullHandler: () => NonNullable<T>
    ) => Computation<NonNullable<T>>;
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
        map: (fn) => compute(fn(initValue)),
        mapSkipNull: (fn) =>
            compute(
                isVoid(initValue)
                    ? (initValue as Extract<T, undefined | null>)
                    : fn(initValue as NonNullable<T>)
            ),
        ifNull: (nullHandler) =>
            compute(
                isVoid(initValue)
                    ? nullHandler()
                    : (initValue as NonNullable<T>)
            ),
        get value() {
            return initValue;
        },
    };
};

export default compute;

export interface Lazy<T> {
    readonly map: <N>(nextFn: (r: T) => N) => Lazy<N>;
    readonly mapSkipNull: <N>(
        nextFn: (r: NonNullable<T>) => N
    ) => Lazy<N | Extract<T, undefined | null>>;
    readonly ifNull: (fn: () => NonNullable<T>) => Lazy<NonNullable<T>>;
    get value(): T;
}

export const lazy = <T>(fn: () => T): Lazy<T> => {
    return {
        map: (nextFn) =>
            lazy(baseCompose<void, T, ReturnType<typeof nextFn>>(fn, nextFn)),
        mapSkipNull: (nextFn) =>
            lazy(
                baseCompose<
                    void,
                    T,
                    ReturnType<typeof nextFn> | Extract<T, undefined | null>
                >(fn, (t: T) =>
                    isVoid(t)
                        ? (t as Extract<T, undefined | null>)
                        : nextFn(t as NonNullable<T>)
                )
            ),
        ifNull: (nullHandler) =>
            lazy(
                baseCompose<void, T, ReturnType<typeof nullHandler>>(
                    fn,
                    (t: T) =>
                        isVoid(t) ? nullHandler() : (t as NonNullable<T>)
                )
            ),
        get value() {
            return fn();
        },
    };
};

export const computeLazy = <T>(initValue: T): Lazy<T> => {
    return lazy(() => initValue);
};
