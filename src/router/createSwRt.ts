import {
    createRoute,
    createRouteX,
    Route,
    RouteHandler,
    RouteHandlerX,
    RouteX,
} from "./createRoute.ts";
import { createSwitcher, createSwitcherX } from "./createSwitcher.ts";

export type RouteChainInit<R> = {
    route: <P extends string>(
        pattern: P,
        handler: RouteHandler<P, R>,
        flags?: string,
    ) => RouteChain<R>;
};
export type RouteChainAdder<R> = <P extends string>(
    pattern: P,
    handler: RouteHandler<P, R>,
    flags?: string,
) => RouteChain<R>;
export type RouteChainFallback<R> = (handler: (url: string) => R) => {
    switcher: (url: string) => R;
};
export type RouteChain<R> = {
    route: RouteChainAdder<R>;
    fallback: RouteChainFallback<NonNullable<R>>;
    switcher: Route<R>;
};

export type RouteChainInitX<R, X> = {
    route: <P extends string>(
        pattern: P,
        handler: RouteHandlerX<P, X, R>,
        flags?: string,
    ) => RouteChainX<R, X>;
};
export type RouteChainAdderX<R, X> = <P extends string>(
    pattern: P,
    handler: RouteHandlerX<P, X, R>,
    flags?: string,
) => RouteChainX<R, X>;
export type RouteChainFallbackX<R, X> = (
    handler: (url: string, extra: X) => R,
) => {
    switcher: (url: string, extra: X) => R;
};
export type RouteChainX<R, X> = {
    route: RouteChainAdderX<R, X>;
    fallback: RouteChainFallbackX<NonNullable<R>, X>;
    switcher: RouteX<R, X>;
};

/**
 * Create a extended switcher and extended routes connect to it at the same time.
 *
 * It returns an object include a `switcher` function and a `route` function, you can
 * use `switcher` function as a switcher, or use `route` function to add one more
 * route to the switcher.
 *
 * For example, you can use it like this:
 *
 * ```js
 * const { switcher } = createSwRt()
 *     .route('/user/<username>/<age>', (p, q) => `User ${p.username} is ${p.age}`)
 *     .route('/user/<username>/hello', (p, q) => `hello, ${p.username}`)
 *
 * const reuslt = switcher(url)
 * ```
 *
 * @returns a route function and switcher function.
 */
export function createSwRt<R>(): RouteChainInit<R> {
    return {
        /**
         * Add first route to the switcher.
         *
         * @param pattern a matching pattern
         * @param handler a handler dealing with the route
         * @returns a router chain.
         */
        route: (pattern, handler, flags) => {
            let routes = [createRoute(pattern, handler, flags)];
            /**
             * Handler the request when no routes matched
             *
             * @param handler a handler receives url and return value
             * @returns object only contains the switcher
             */
            const fallback: RouteChainFallback<NonNullable<R>> = (handler) => ({
                switcher: (url) =>
                    (createSwitcher(...routes)(url) as
                        | NonNullable<R>
                        | null
                        | undefined) ?? handler(url),
            });
            /**
             * Add another route to the switcher.
             *
             * @param pattern a matching pattern
             * @param handler a handler dealing with the route
             * @returns a router chain.
             */
            const route: RouteChainAdder<R> = (pattern, handler, flags) => {
                routes = [...routes, createRoute(pattern, handler, flags)];
                return { route, switcher: createSwitcher(...routes), fallback };
            };
            return { route, switcher: createSwitcher(...routes), fallback };
        },
    };
}

/**
 * Create a extended switcher and extended routes connect to it at the same time.
 *
 * It returns an object include a `switcher` function and a `route` function, you can
 * use `switcher` function as a switcher, or use `route` function to add one more
 * route to the switcher.
 *
 * For example, you can use it like this:
 *
 * ```ts
 * const { switcher } = createExtendSwRt<string, Request>()
 *     .route('/user/<username>/<age>', (p, q, x) => `User ${p.username} is ${p.age}, request from ${x.ip}`)
 *     .route('/user/<username>/hello', (p, q, x) => `hello, ${p.username}, request from ${x.ip}`)
 *
 * const reuslt = switcher(url, req)
 * ```
 *
 * @returns a route function and switcher function.
 */
export function createSwRtX<R, X>(): RouteChainInitX<R, X> {
    return {
        /**
         * Add first extend route to the switcher.
         *
         * @param pattern a matching pattern
         * @param handler a handler dealing with the route
         * @returns a router chain.
         */
        route: (pattern, handler, flags) => {
            let routes = [createRouteX(pattern, handler, flags)];
            /**
             * Handler the request when no routes matched
             *
             * @param handler a handler receives url and return value
             * @returns object only contains the switcher
             */
            const fallback: RouteChainFallbackX<NonNullable<R>, X> = (
                handler,
            ) => {
                return {
                    switcher: (url, extra) =>
                        (createSwitcherX(...routes)(url, extra) as
                            | NonNullable<R>
                            | null
                            | undefined) ?? handler(url, extra),
                };
            };
            /**
             * Add another extend route to the switcher.
             *
             * @param pattern a matching pattern
             * @param handler a handler dealing with the route
             * @returns a router chain.
             */
            const route: RouteChainAdderX<R, X> = (pattern, handler, flags) => {
                routes = [...routes, createRouteX(pattern, handler, flags)];
                return {
                    route,
                    fallback,
                    switcher: createSwitcherX(...routes),
                };
            };
            return {
                route,
                fallback,
                switcher: createSwitcherX(...routes),
            };
        },
    };
}
