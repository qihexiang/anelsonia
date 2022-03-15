import { baseCompose } from "./composeFn.ts";
import { isVoid } from "./isVoid.ts";

/**
 * A container of a value for compute in a stream
 */
export interface Computation<T> {
    /**
     * Map a function to the value in the container.
     */
    map: <R>(fn: (t: T) => R) => Computation<R>;
    /**
     * Map a function to the value in the caontainer,
     * but left the origin value if it's undefined or null.
     */
    mapSkipNull: <R>(
        nextFn: (r: NonNullable<T>) => R,
    ) => Computation<R | Extract<T, undefined | null>>;
    /**
     * Unpack the value if it's a Promise, and return a Computation
     * that contains a value in Promise.
     */
    aMap: <R>(
        fn: (t: Awaited<T>) => R,
    ) => Computation<Promise<Awaited<R>>>;
    /**
     * Just like `mapSkipNull`, but it will unpack the Promise value
     * as a parameter, and pack the result into a Promise
     */
    aMapSkipNull: <R>(
        fn: (t: NonNullable<Awaited<T>>) => R,
    ) => Computation<
        Promise<Awaited<R> | Extract<Awaited<T>, undefined | null>>
    >;
    /**
     * Use a value to replace empty value (null and undefined)
     */
    ifNull: <R>(
        fn: () => R,
    ) => Computation<NonNullable<T> | R>;
    /**
     * Use a value to replace empty value, but will unpack to check, and
     * return a Promise packed value
     */
    aIfNull: <R>(
        fn: () => R,
    ) => Computation<Promise<NonNullable<Awaited<T>> | Awaited<R>>>;
    get value(): T;
}

/**
 * create a Computation container and put a value in. This container is
 * in eager mode, which means computed when method called.
 *
 * @param initValue The initial value
 * @returns a Computation container
 */
export function compute<T>(initValue: T): Computation<T> {
    return {
        map: (fn) => compute(fn(initValue)),
        mapSkipNull: (fn) =>
            compute(
                isVoid(initValue)
                    ? (initValue as Extract<T, undefined | null>)
                    : fn(initValue as NonNullable<T>),
            ),
        aMap: (fn) => {
            type R = ReturnType<typeof fn>;
            if (initValue instanceof Promise) {
                return compute(
                    initValue.then((t: Awaited<T>) =>
                        fn(t as Awaited<T>)
                    ) as Promise<
                        Awaited<R>
                    >,
                );
            }
            return compute(
                Promise.resolve(fn(initValue as Awaited<T>)) as Promise<
                    Awaited<R>
                >,
            );
        },
        aMapSkipNull: (fn) => {
            type R = ReturnType<typeof fn>;
            if (initValue instanceof Promise) {
                return compute(
                    initValue.then((t: Awaited<T>) =>
                        isVoid(t) ? t : fn(t as NonNullable<Awaited<T>>)
                    ) as Promise<
                        Awaited<R> | Extract<Awaited<T>, undefined | null>
                    >,
                );
            }
            return compute(
                Promise.resolve(
                    isVoid(initValue)
                        ? initValue
                        : fn(initValue as NonNullable<Awaited<T>>),
                ) as Promise<
                    Awaited<R> | Extract<Awaited<T>, undefined | null>
                >,
            );
        },
        ifNull: (fn) => {
            if (isVoid(initValue)) return compute(fn());
            return compute(initValue as NonNullable<T>);
        },
        aIfNull: (fn) => {
            type R = ReturnType<typeof fn>;
            if (initValue instanceof Promise) {
                return compute(initValue.then((t: Awaited<T>) =>
                    isVoid(t)
                        ? fn() as Awaited<R>
                        : t as NonNullable<Awaited<T>>
                ));
            }
            return compute(
                Promise.resolve(initValue).then((t) =>
                    isVoid(t)
                        ? fn() as Awaited<R>
                        : t as NonNullable<Awaited<T>>
                ),
            );
        },
        get value() {
            return initValue;
        },
    };
}

const lazy = <T>(fn: () => T): Computation<T> => {
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
                        : nextFn(t as NonNullable<T>)),
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
                        t: T,
                    ): Promise<Awaited<ReturnType<typeof nextFn>>> => {
                        const value = await t;
                        return await nextFn(value as Awaited<T>);
                    },
                ),
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
                        t: T,
                    ): Promise<
                        | Awaited<ReturnType<typeof nextFn>>
                        | Extract<Awaited<T>, undefined | null>
                    > => {
                        const value = await t;
                        if (isVoid(value)) return value;
                        return await nextFn(value as NonNullable<Awaited<T>>);
                    },
                ),
            ),
        ifNull: (nextFn) =>
            lazy(
                baseCompose<
                    void,
                    T,
                    ReturnType<typeof nextFn> | NonNullable<T>
                >(fn, (t: T) => {
                    if (isVoid(t)) return nextFn();
                    else return t as NonNullable<T>;
                }),
            ),
        aIfNull: (nextFn) => {
            type R = ReturnType<typeof nextFn>;
            return lazy(
                baseCompose<
                    void,
                    T,
                    Promise<NonNullable<Awaited<T>> | Awaited<R>>
                >(fn, (t: T) => {
                    if (t instanceof Promise) {
                        return t.then((value: Awaited<T>) =>
                            isVoid(t)
                                ? nextFn() as Awaited<R>
                                : value as NonNullable<Awaited<T>>
                        );
                    } else {
                        return Promise.resolve(
                            isVoid(t)
                                ? nextFn() as Awaited<R>
                                : t as NonNullable<Awaited<T>>,
                        );
                    }
                }),
            );
        },
        get value() {
            return fn();
        },
    };
};

/**
 * Create a Computation container and put a value in. This container is in
 * lazy mode, which means methos of it will just compose functions, and
 * do computation on each time access the `value` property.
 *
 * @param initValue the initial value to be computed
 * @returns a Computation container in lazy mode.
 */
export function computeLazy<T>(initValue: T): Computation<T> {
    return lazy(() => initValue);
}
