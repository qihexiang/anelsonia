import { RouteHandler, RouterChain, Route, Condition } from "./types";
import { createRoute } from "./createRoute";
import { hubRoutes } from "./createHub";

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

export function routing<T>(): RouterChain<T> {
    const routes: Route<T>[] = [];
    function match<P extends string>(pathname: P, handler: RouteHandler<P, T>): RouterChain<T> {
        routes.push(createRoute(pathname, handler));
        return { match, build };
    }
    function build(): Route<T> {
        return hubRoutes(...routes);
    }
    return { match, build };
}
