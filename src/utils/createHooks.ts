/**
 * Create hooks for a function receives P and returns R
 * 
 * @param hook a hook function execute before original function,
 * and modify input parameter to original function, and return a
 * hook function execute after original function to modify the 
 * return value
 * @returns a hooker.
 */
 export function createHooks<P, R>(hook: (p: P) => [P, (r: R, p: P) => R]): (fn: (p: P) => R) => (p: P) => R {
    return fn => preP => {
        const [p, after] = hook(preP);
        const r = fn(p);
        return after(r, p);
    };
}

export default createHooks
