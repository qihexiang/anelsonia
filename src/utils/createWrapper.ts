/**
 * Create hooks for a function, which you can change argument passed
 * to original function in before hook, and change the return value
 * of original function.
 * 
 * @param hook a hook function execute before original function,
 * and modify input parameter to original function, and return a
 * hook function execute after original function to modify the 
 * return value
 * @returns a hooker.
 */
export function createWrapper<O extends (...args: any[]) => any, N extends (...args: any[]) => any = O>(hook: (...args: Parameters<N>) => [Parameters<O>, (r: ReturnType<O>) => ReturnType<N>]): (fn: (...args: Parameters<O>) => ReturnType<O>) => (...args: Parameters<N>) => ReturnType<N> {
    return fn => (...args) => {
        const [p, after] = hook(...args);
        const r = fn(...p);
        return after(r);
    };
}

export default createWrapper;
