import { Fn } from "../utils";
import { useRequest } from "./hooks";
import { HttpReq } from "./shimHTTP";

type ProvideContext<T> = <F extends Fn>(value: T, fn: F) => (...args: Parameters<F>) => ReturnType<F>;
type UseContext<T> = () => T;

export function createContext<T>(): [ProvideContext<T>, UseContext<T>] {
    const wm = new WeakMap<HttpReq, T>();
    function provideContext<F extends Fn>(value: T, fn: F): ((...args: Parameters<F>) => ReturnType<F>) {
        return (...args: Parameters<F>): ReturnType<F> => {
            const req = useRequest();
            wm.set(req, value);
            const result = fn(...args);
            wm.delete(req);
            return result
        }
    }
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