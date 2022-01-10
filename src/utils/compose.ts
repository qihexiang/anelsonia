interface Composer<T, R> {
    next: <V>(anotherFn: (r: R) => V) => Composer<T, V>,
    fn: (t: T) => R;
}

export function composer<T, R>(nextFn: (t: T) => R): Composer<T, R>;
export function composer<T, R, P>(nextFn: (t: T) => R, lastFn: (p: P) => T): Composer<P, R>;
export function composer<T, R, P>(nextFn: (t: T) => R, lastFn?: ((p: P) => T) | undefined) {
    if (lastFn === undefined) {
        const next = <V>(anotherFn: (t: R) => V) => composer(anotherFn, nextFn);
        return {
            fn: nextFn, next
        };
    }
    const fn = function (p: P) { return nextFn(lastFn(p)); };
    const next = <V>(anotherFn: (r: R) => V) => composer(anotherFn, fn);
    return {
        fn, next
    };
}