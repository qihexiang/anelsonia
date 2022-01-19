/**
 * Create hooks for a function receives P and returns R
 * 
 * @param hook a hook function execute before original function,
 * and modify input parameter to original function, and return a
 * hook function execute after original function to modify the 
 * return value
 * @returns a hooker.
 */
export function createHooks<F extends (...args: any[]) => any>(hook: (...args: Parameters<F>) => [Parameters<F>, (r: ReturnType<F>) => ReturnType<F>]): (fn: (...args: Parameters<F>) => ReturnType<F>) => (...args: Parameters<F>) => ReturnType<F> {
    return fn => (...args) => {
        const [p, after] = hook(...args);
        const r = fn(...p);
        return after(r);
    };
}

export default createHooks;
