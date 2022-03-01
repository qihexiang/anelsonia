export interface Composer<T, R> {
    readonly next: <V>(anotherFn: (r: R) => V) => Composer<T, V>;
    get fn(): (t: T) => R;
}

export const baseCompose = <P, T, R>(a: (param: P) => T, b: (temp: T) => R) =>
    (param: P) => b(a(param));

/**
 * Create a function composition, and add first function.
 *
 * @param currentFn a function that receive one value of type T and return a value of type R.
 */
export function composeFn<T, R>(currentFn: (t: T) => R): Composer<T, R> {
    return {
        next: (fn) => composeFn(baseCompose(currentFn, fn)),
        get fn() {
            return currentFn;
        },
    };
}

export default composeFn;
