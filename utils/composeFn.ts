/**
 * Composer defines a container of function, which can compose with another function
 */
export interface Composer<T, R> {
    /**
     * next method can compose current function and anther function,
     * and return a Composer container include the composed function.
     */
    readonly next: <V>(anotherFn: (r: R) => V) => Composer<T, V>;
    /**
     * The composed function.
     */
    get fn(): (t: T) => R;
}

/**
 * The basic compose function, which can compose two functions together.
 *
 * @param a the first function th be called.
 * @param b the function use return value of `a`
 * @returns a composed function.
 */
export function baseCompose<P, T, R>(
    a: (param: P) => T,
    b: (temp: T) => R,
): (p: P) => R {
    return (param: P) => b(a(param));
}

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
