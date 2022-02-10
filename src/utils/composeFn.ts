export interface Composer<T, R> {
    next: <V>(anotherFn: (r: R) => V) => Composer<T, V>;
    fn: (t: T) => R;
}

export const baseCompose =
    <T, R, S>(a: (t: T) => R, b: (r: R) => S) =>
    (t: T) =>
        b(a(t));

/**
 * Create a function composition, and add first function.
 *
 * @param currentFn a function that receive one value of type T and return a value of type R.
 */
export function composeFn<T, R>(currentFn: (t: T) => R): Composer<T, R> {
    return {
        next: (fn) => composeFn(baseCompose(currentFn, fn)),
        fn: currentFn,
    };
}

export default composeFn;
