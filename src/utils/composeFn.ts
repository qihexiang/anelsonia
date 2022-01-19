export interface Composer<T, R> {
    next: <V>(anotherFn: (r: R) => V) => Composer<T, V>,
    fn: (t: T) => R;
}

/**
 * Create a function composition, and add first function.
 * 
 * @param nextFn a function that receive one value of type T and return a value of type R.
 */
export function composeFn<T, R>(firstFn: (t: T) => R): Composer<T, R>;
/**
 * This overload is designed for internal using, two parameters are the next function
 * and the first function. If you'd like to compose just 2 functions it's no problem using
 * this, otherwise it's recomended using first overload of this function.
 * 
 * This function has 3 generic parameters, P is the parameter of lastFn, T is the return type of lastFn
 * and the parameter type of nextFn, and R is the return type of nextFn.
 * 
 * @param nextFn the function to be called later, receives T and return R
 * @param lastFn the function to be called earlier, receives P and return T
 */
export function composeFn<T, R, P>(nextFn: (t: T) => R, lastFn: (p: P) => T): Composer<P, R>;
export function composeFn<T, R, P>(nextFn: (t: T) => R, lastFn?: ((p: P) => T) | undefined) {
    if (lastFn === undefined) {
        /**
         * Add another function which receive parameter of type R and return a value of type V.
         * Type R is just what last added function returns, and V will become the parameter for
         * next function to receive.
         * 
         * @param anotherFn a function added to the composition
         * @returns an object implements Composer<T,V>, T is the first function's parameter type,
         * V is current function's return type, or next function's parameter type.
         */
        const next = <V>(anotherFn: (t: R) => V) => composeFn(anotherFn, nextFn);
        return {
            fn: nextFn, next
        };
    }
    const fn = function (p: P) { return nextFn(lastFn(p)); };
    /**
     * Add another function which receive parameter of type R and return a value of type V.
     * Type R is just what last added function returns, and V will become the parameter for
     * next function to receive.
     * 
     * @param anotherFn a function added to the composition
     * @returns an object implements Composer<T,V>, T is the first function's parameter type,
     * V is current function's return type, or next function's parameter type.
     */
    const next = <V>(anotherFn: (r: R) => V) => composeFn(anotherFn, fn);
    return {
        fn, next
    };
}

export default composeFn
