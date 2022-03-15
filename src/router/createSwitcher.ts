import { Route, RouteX } from "./createRoute.ts";

/**
 * Create a switcher connected to many routes.
 * Routes will be matched with the order of
 * the arguments.
 *
 * @param routes routes created by createRoute() and has
 * same return type, for example some routes with handlers
 * all return string.
 *
 * @returns a function that receive a string as argument, if the
 * string matched the pattern, call the handler and return its
 * result, otherwise return null.
 */
export function createSwitcher<R>(...routes: Route<R>[]): Route<R> {
    return (url: string): R | null =>
        routes.reduce<R | null>(
            (lastRouted, nextRoute) => lastRouted ?? nextRoute(url),
            null,
        );
}

/**
 * Create a switcher connected to many routes with same
 * extra argument. Routes will be matched with the order of
 * the arguments.
 *
 * @param routes routes created by createExtRoute() and has
 * same return type, for example some routes with handlers
 * all return string.
 *
 * @returns a function that receive a string argument and
 * a extra arugment, if the string matched the pattern,
 * call the handler and return its result, otherwise return
 * null.
 */
export function createSwitcherX<R, X>(...routes: RouteX<R, X>[]): RouteX<R, X> {
    return (url: string, extra: X): R | null =>
        routes.reduce<R | null>(
            (lastRouted, nextRoute) => lastRouted ?? nextRoute(url, extra),
            null,
        );
}
