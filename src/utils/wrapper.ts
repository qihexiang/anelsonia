export const createWrapper =
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
    <P, T, R>(before: (p: P) => T, after: (t: T, r: R, p: P) => R) =>
        /**
         * Wrapper function.
         * 
         * @param fn a function that receive parameter in type `P` and return 
         * something in type `R`
         * @returns a function in the same type of `fn`
         */
        (fn: (p: P) => R) =>
            (p: P) => {
                const t = before(p);
                const r = fn(p);
                return after(t, r, p);
            };
