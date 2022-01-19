/**
 * Create a hook executed before wrapped function and return a hook
 * executed after wrapped function. Wrapper would not change the 
 * input and output of the original function
 * 
 * @param hook a function that receive wrapped function's parameter
 * and executed before it, then return a hook function executed after
 * the wrapped function. 
 */
export function createWrapper<P, R>(hook: (p: P) => (r: Readonly<R>) => void): (fn: (p: P) => R) => (p: P) => R {
    return fn => p => {
        const hookAfter = hook(p);
        const r = fn(p);
        hookAfter(r);
        return r;
    };
}

export default createWrapper;
