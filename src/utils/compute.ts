import { baseCompose } from "./composeFn.ts";
import { isVoid } from "./isVoid.ts";
import { MaybePromise } from "./MaybePromise.ts";

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
 * @deprecated will be removed in v2.0.0
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
 * @deprecated will be removed in v2.0.0
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

type ComputeStream<T> = {
    map<R>(callbackFn: (value: Awaited<T>) => R): ComputeStream<T extends Promise<infer _M> ? R extends Promise<infer _AwaitedR> ? R : Promise<R> : R>;
    mapNN<R>(callbackFn: (value: NonNullable<Awaited<T>>) => R): ComputeStream<T extends Promise<infer _N> ? R extends Promise<infer AwaitedR> ? Promise<AwaitedR | Extract<Awaited<T>, undefined | null>> : Promise<R | Extract<Awaited<T>, undefined | null>> : R | Extract<Awaited<T>, undefined | null>>; get value(): T;
};

/**
 * @experimental will be stablized in v2.0.0
 * 
 * @param initValue Give a initial value to start the computation stream.
 * @returns a container that contains the value.
 */
export function computeStream<T>(initValue: T): ComputeStream<T> {
    function map<R>(callbackFn: T extends Promise<infer N> ? (value: N) => R : (value: T) => R): ComputeStream<T extends Promise<infer _M> ? R extends Promise<infer _AwaitedR> ? R : Promise<R> : R>;
    function map<R>(callbackFn: (value: Awaited<T>) => R): ComputeStream<MaybePromise<R>> {
        return computeStream(initValue instanceof Promise ? initValue.then((value: Awaited<T>) => callbackFn(value)) : callbackFn(initValue as Awaited<T>));
    }
    function mapNN<R>(callbackFn: T extends Promise<infer N> ? (value: NonNullable<N>) => R : (value: NonNullable<T>) => R): ComputeStream<T extends Promise<infer _N> ? R extends Promise<infer AwaitedR> ? Promise<AwaitedR | Extract<Awaited<T>, undefined | null>> : Promise<R | Extract<Awaited<T>, undefined | null>> : R | Extract<Awaited<T>, undefined | null>>;
    function mapNN<R>(callbackFn: (value: NonNullable<Awaited<T>>) => R): ComputeStream<MaybePromise<R | Extract<Awaited<T>, undefined | null>>> {
        return computeStream(initValue instanceof Promise ? initValue.then((value: Awaited<T>) => isVoid(value) ? value : callbackFn(value as NonNullable<Awaited<T>>)) : (isVoid(initValue) ? initValue as Extract<Awaited<T>, undefined | null> : callbackFn(initValue as NonNullable<Awaited<T>>)));
    }
    return {
        map, mapNN, get value() { return initValue; }
    };
}

/**
 * @experimental will be stablized in v2.0.0
 * 
 * @param initFn Give a function that can return the value to start a lazy computation stream.
 * @returns a container that contains the value.
 */
export function computeStreamLazy<T>(initFn: () => T): ComputeStream<T> {
    function map<R>(callbackFn: T extends Promise<infer N> ? (value: N) => R : (value: T) => R): ComputeStream<T extends Promise<infer _M> ? R extends Promise<infer _AwaitedR> ? R : Promise<R> : R>;
    function map<R>(callbackFn: (value: Awaited<T>) => R): ComputeStream<MaybePromise<R>> {
        return computeStreamLazy(baseCompose<void, T, MaybePromise<R>>(initFn, (value: T) => {
            return value instanceof Promise ? value.then((awaited: Awaited<T>) => callbackFn(awaited)) : callbackFn(value as Awaited<T>);
        }));
    }
    function mapNN<R>(callbackFn: T extends Promise<infer N> ? (value: NonNullable<N>) => R : (value: NonNullable<T>) => R): ComputeStream<T extends Promise<infer _N> ? R extends Promise<infer AwaitedR> ? Promise<AwaitedR | Extract<Awaited<T>, undefined | null>> : Promise<R | Extract<Awaited<T>, undefined | null>> : R | Extract<Awaited<T>, undefined | null>>;
    function mapNN<R>(callbackFn: (value: NonNullable<Awaited<T>>) => R): ComputeStream<MaybePromise<R | Extract<Awaited<T>, undefined | null>>> {
        return computeStreamLazy(baseCompose<void, T, MaybePromise<R | Extract<Awaited<T>, undefined | null>>>(initFn, (value: T) => {
            return value instanceof Promise ? value.then((awaited: Awaited<T>) => isVoid(awaited) ? awaited : callbackFn(awaited as NonNullable<Awaited<T>>)) :
                isVoid(value) ? value as Extract<Awaited<T>, undefined | null> : callbackFn(value as NonNullable<Awaited<T>>);
        }));
    }
    return {
        map, mapNN, get value() { return initFn(); }
    };
}

export function fillNullable<T>(defaultValue: T): (value: T | undefined | null) => T {
    return (value: T | undefined | null) => isVoid(value) ? defaultValue : value as NonNullable<T>;
}
