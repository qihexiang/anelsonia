import { Fn } from "../utils";
import { useRequest } from "./hooks";
import { HttpReq } from "./freesia";

type ProvideContext<T> = <F extends Fn>(value: T, fn: F) => (...args: Parameters<F>) => ReturnType<F>;
type UseContext<T> = () => T;

/**
 * Create a context for inner function to access a value.
 * 
 * @returns [provideContext, useContext]
 */
export function createContext<T>(): [ProvideContext<T>, UseContext<T>] {
    const wm = new WeakMap<HttpReq, T>();
    /**
     * Context wrapper for a function
     * 
     * @param value The context value provided to the inner function
     * @param fn The function to be called
     * @returns wrapped funtion to call
     */
    function provideContext<F extends Fn>(value: T, fn: F): ((...args: Parameters<F>) => ReturnType<F>) {
        return (...args: Parameters<F>): ReturnType<F> => {
            const req = useRequest();
            wm.set(req, value);
            const result = fn(...args);
            wm.delete(req);
            return result
        }
    }
    /**
     * Use this function to access context in a wrapped function
     * @returns the value
     */
    function useContext() {
        const req = useRequest();
        if(wm.has(req)) {
            return wm.get(req) as T;
        } else {
            throw new Error("No context found");
        }
    }
    return [provideContext, useContext];
}