import { baseCompose } from "./composeFn";
import { isVoid } from "./isVoid";
type Then<T> = T extends Promise<infer N> ? Then<N> : T;

export interface Computation<T> {
    readonly map: <R>(fn: (t: T) => R) => Computation<R>;
    readonly mapSkipNull: <R>(
        nextFn: (r: NonNullable<T>) => R
    ) => Computation<R | Extract<T, undefined | null>>;
    readonly aMap: <R>(fn: (t: Then<T>) => R) => Computation<Promise<Then<R>>>;
    readonly aMapSkipNull: <R>(
        fn: (t: NonNullable<Then<T>>) => R
    ) => Computation<Promise<Then<R> | Extract<Then<T>, undefined | null>>>;
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
        aMap: (fn) => {
            type R = ReturnType<typeof fn>;
            if (initValue instanceof Promise)
                return compute(
                    initValue.then((t: Then<T>) => fn(t)) as Promise<Then<R>>
                );
            return compute(
                Promise.resolve(fn(initValue as Then<T>)) as Promise<Then<R>>
            );
        },
        aMapSkipNull: (fn) => {
            type R = ReturnType<typeof fn>;
            if (initValue instanceof Promise)
                return compute(
                    initValue.then((t: Then<T>) =>
                        isVoid(t) ? t : fn(t as NonNullable<Then<T>>)
                    ) as Promise<Then<R> | Extract<Then<T>, undefined | null>>
                );
            return compute(
                Promise.resolve(
                    fn(initValue as NonNullable<Then<T>>)
                ) as Promise<Then<R>>
            );
        },
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
    readonly aMap: <N>(
        nextFn: (t: Awaited<T>) => N
    ) => Lazy<Promise<Awaited<N>>>;
    readonly aMapSkipNull: <N>(
        nextFn: (t: NonNullable<Awaited<T>>) => N
    ) => Lazy<Promise<Awaited<N> | Extract<Awaited<T>, undefined | null>>>;
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
        aMap: (nextFn) =>
            lazy(
                baseCompose<
                    void,
                    T,
                    Promise<Awaited<ReturnType<typeof nextFn>>>
                >(
                    fn,
                    async (
                        t: T
                    ): Promise<Awaited<ReturnType<typeof nextFn>>> => {
                        const value = await t;
                        return await nextFn(value as Awaited<T>);
                    }
                )
            ),
        aMapSkipNull: (nextFn) =>
            lazy(
                baseCompose<
                    void,
                    T,
                    Promise<
                        | Awaited<ReturnType<typeof nextFn>>
                        | Extract<Awaited<T>, undefined | null>
                    >
                >(
                    fn,
                    async (
                        t: T
                    ): Promise<
                        | Awaited<ReturnType<typeof nextFn>>
                        | Extract<Awaited<T>, undefined | null>
                    > => {
                        const value = await t;
                        if (isVoid(value)) return value;
                        return await nextFn(value as NonNullable<Awaited<T>>);
                    }
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
