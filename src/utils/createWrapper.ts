/**
 * Create a hook executed before wrapped function and return a hook
 * executed after wrapped function. Wrapper would not change the 
 * input and output of the original function
 * 
 * @param hook a function that receive wrapped function's parameter
 * and executed before it, then return a hook function executed after
 * the wrapped function. 
 */
export function createWrapper<F extends (...args: any) => any>(hook: (...args: Parameters<F>) => (r: Readonly<ReturnType<F>>) => void): (fn: (...args: Parameters<F>) => ReturnType<F>) => (...args: Parameters<F>) => ReturnType<F> {
    return fn => (...p) => {
        const hookAfter = hook(...p);
        const r = fn(...p);
        hookAfter(r);
        return r;
    };
}

export default createWrapper;
