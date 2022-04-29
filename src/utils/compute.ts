import { baseCompose } from "./composeFn";
import { isVoid } from "./isVoid";
import { MaybePromise } from "./MaybePromise";

export type ComputeStream<T> = {
    map<R>(
        callbackFn: (value: Awaited<T>) => R
    ): ComputeStream<
        T extends Promise<infer _M>
            ? R extends Promise<infer _AwaitedR>
                ? R
                : Promise<R>
            : R
    >;
    mapNN<R>(
        callbackFn: (value: NonNullable<Awaited<T>>) => R
    ): ComputeStream<
        T extends Promise<infer _N>
            ? R extends Promise<infer AwaitedR>
                ? Promise<AwaitedR | Extract<Awaited<T>, undefined | null>>
                : Promise<R | Extract<Awaited<T>, undefined | null>>
            : R | Extract<Awaited<T>, undefined | null>
    >;
    get value(): T;
};

/**
 * Create a computation stream.
 *
 * @param initValue Give a initial value to start the computation stream.
 * @returns a container that contains the value.
 */
export function computeStream<T>(initValue: T): ComputeStream<T> {
    function map<R>(
        callbackFn: T extends Promise<infer N>
            ? (value: N) => R
            : (value: T) => R
    ): ComputeStream<
        T extends Promise<infer _M>
            ? R extends Promise<infer _AwaitedR>
                ? R
                : Promise<R>
            : R
    >;
    function map<R>(
        callbackFn: (value: Awaited<T>) => R
    ): ComputeStream<MaybePromise<R>> {
        return computeStream(
            initValue instanceof Promise
                ? initValue.then((value: Awaited<T>) => callbackFn(value))
                : callbackFn(initValue as Awaited<T>)
        );
    }
    function mapNN<R>(
        callbackFn: T extends Promise<infer N>
            ? (value: NonNullable<N>) => R
            : (value: NonNullable<T>) => R
    ): ComputeStream<
        T extends Promise<infer _N>
            ? R extends Promise<infer AwaitedR>
                ? Promise<AwaitedR | Extract<Awaited<T>, undefined | null>>
                : Promise<R | Extract<Awaited<T>, undefined | null>>
            : R | Extract<Awaited<T>, undefined | null>
    >;
    function mapNN<R>(
        callbackFn: (value: NonNullable<Awaited<T>>) => R
    ): ComputeStream<MaybePromise<R | Extract<Awaited<T>, undefined | null>>> {
        return computeStream(
            initValue instanceof Promise
                ? initValue.then((value: Awaited<T>) =>
                      isVoid(value)
                          ? value
                          : callbackFn(value as NonNullable<Awaited<T>>)
                  )
                : isVoid(initValue)
                ? (initValue as Extract<Awaited<T>, undefined | null>)
                : callbackFn(initValue as NonNullable<Awaited<T>>)
        );
    }
    return {
        map,
        mapNN,
        get value() {
            return initValue;
        },
    };
}

/**
 * Create a computation stream with lazy-computation features
 *
 * @param initFn Give a function that can return the value to start a lazy computation stream.
 * @returns a container that contains the value.
 */
export function computeStreamLazy<T>(initFn: () => T): ComputeStream<T> {
    function map<R>(
        callbackFn: T extends Promise<infer N>
            ? (value: N) => R
            : (value: T) => R
    ): ComputeStream<
        T extends Promise<infer _M>
            ? R extends Promise<infer _AwaitedR>
                ? R
                : Promise<R>
            : R
    >;
    function map<R>(
        callbackFn: (value: Awaited<T>) => R
    ): ComputeStream<MaybePromise<R>> {
        return computeStreamLazy(
            baseCompose<void, T, MaybePromise<R>>(initFn, (value: T) => {
                return value instanceof Promise
                    ? value.then((awaited: Awaited<T>) => callbackFn(awaited))
                    : callbackFn(value as Awaited<T>);
            })
        );
    }
    function mapNN<R>(
        callbackFn: T extends Promise<infer N>
            ? (value: NonNullable<N>) => R
            : (value: NonNullable<T>) => R
    ): ComputeStream<
        T extends Promise<infer _N>
            ? R extends Promise<infer AwaitedR>
                ? Promise<AwaitedR | Extract<Awaited<T>, undefined | null>>
                : Promise<R | Extract<Awaited<T>, undefined | null>>
            : R | Extract<Awaited<T>, undefined | null>
    >;
    function mapNN<R>(
        callbackFn: (value: NonNullable<Awaited<T>>) => R
    ): ComputeStream<MaybePromise<R | Extract<Awaited<T>, undefined | null>>> {
        return computeStreamLazy(
            baseCompose<
                void,
                T,
                MaybePromise<R | Extract<Awaited<T>, undefined | null>>
            >(initFn, (value: T) => {
                return value instanceof Promise
                    ? value.then((awaited: Awaited<T>) =>
                          isVoid(awaited)
                              ? awaited
                              : callbackFn(awaited as NonNullable<Awaited<T>>)
                      )
                    : isVoid(value)
                    ? (value as Extract<Awaited<T>, undefined | null>)
                    : callbackFn(value as NonNullable<Awaited<T>>);
            })
        );
    }
    return {
        map,
        mapNN,
        get value() {
            return initFn();
        },
    };
}

export function fillNullable<T>(
    defaultValue: NonNullable<T>
): (value: T | undefined | null) => NonNullable<T> {
    return (value: T | undefined | null) =>
        isVoid(value) ? defaultValue : (value as NonNullable<T>);
}
