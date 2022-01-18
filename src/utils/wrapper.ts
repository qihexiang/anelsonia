/**
 * Create a hook executed before wrapped function and return a hook
 * executed after wrapped function. 
 * 
 * @param hook a function that receive wrapped function's parameter
 * and executed before it, then return a hook function executed after
 * the wrapped function. 
 */
export function createWrapper<P, R>(hook: (p: P) => (r: R) => R): (fn: (p: P) => R) => (p: P) => R;
/**
 * Create a wrapper with 2 hooks executed before and after wrapped
 * function.
 * 
 * @param before hook that executed before wrapped function, receive
 * parameter of wrapped function in type `P` as its parameter, and 
 * return something in type `T` for after hook to use.
 * @param after hook that executed after wrapped function, can receive
 * at most 3 parameters, `t` in type `T` from before hook, `r` in type `R`
 * from wrapped function, `p` in type `P` which is the parameter of 
 * wrapped function, it should return the value wrapped function need to 
 * return. 
 * @returns a wrapper.
 */
export function createWrapper<P, T, R>(before: (p: P) => T, after: (t: T, r: R, p: P) => R): (fn: (p: P) => R) => (p: P) => R;
export function createWrapper<P, T, R>(hookBefore: ((p: P) => T) | ((p: P) => (r: R) => R), hookAfter?: (t: T, r: R, p: P) => R): (fn: (p: P) => R) => (p: P) => R {
    if (hookAfter !== undefined) {
        /**
         * Wrapper function.
         * 
         * @param fn a function that receive parameter in type `P` and return 
         * something in type `R`
         * @returns a function in the same type of `fn`
         */
        return fn =>
            p => {
                const t = hookBefore(p) as T;
                const r = fn(p);
                return hookAfter(t, r, p);
            };
    }
    return fn => p => {
        const hookAfter = hookBefore(p) as (r: R) => R;
        const r = fn(p);
        return hookAfter(r);
    };
}
