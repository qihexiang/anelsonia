import { RouteHandler, createRouter, RouterChain } from ".";

interface ConditionCallback<T> {
    (condition: string): T;
}

interface Condition<T> {
    match: (condition: string, callback: ConditionCallback<T>) => Condition<T>;
    getResult: () => T | null;
}

export function condition<T>(reality: string): Condition<T> {
    let result: T | null = null;
    function getResult() {
        return result;
    }
    function match(condition: string, callback: (condition: string) => T): Condition<T> {
        if (condition === reality) result = callback(reality);
        return {
            match, getResult
        };
    }
    return { match, getResult };
}

export function routing<T>(url: string): RouterChain<T> {
    let executed: T | null = null;
    function match<P extends string>(pathname: P, handler: RouteHandler<P, T>): RouterChain<T> {
        executed = executed ?? createRouter(pathname, handler)(url);
        return { match, route };
    }
    function route(): T | null {
        return executed;
    }
    return { match, route };
}
