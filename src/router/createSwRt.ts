import { Route, ExtendRoute, RouteHandler, ExtendRouteHandler, createRoute, createExtendRoute } from "./createRoute";
import { createSwitcher, createExtendSwitcher } from "./createSwitcher";

export type RouteChainInit = {
    route: <R, P extends string>(pattern: P, handler: RouteHandler<P, R>) => RouteChain<R>;
};
export type RouteChainAdder<R> = <P extends string>(pattern: P, handler: RouteHandler<P, R>) => RouteChain<R>;
export type RouteChainFallback<R> = (handler: (url: string) => R) => {
    switcher: (url: string) => R;
};
export type RouteChain<R> = {
    route: RouteChainAdder<R>;
    fallback: RouteChainFallback<R>;
    switcher: Route<R>;
};

export type ExtendRouteChainInit = {
    route: <R, X, P extends string>(pattern: P, handler: ExtendRouteHandler<P, X, R>) => ExtendRouteChain<R, X>;
};
export type ExtendRouteChainAdder<R, X> = <P extends string>(pattern: P, handler: ExtendRouteHandler<P, X, R>) => ExtendRouteChain<R, X>;
export type ExtendRouteChainFallback<R, X> = (handler: (url: string, extra: X) => R) => {
    switcher: (url: string, extra: X) => R;
};
export type ExtendRouteChain<R, X> = {
    route: ExtendRouteChainAdder<R, X>;
    fallback: ExtendRouteChainFallback<R, X>;
    switcher: ExtendRoute<R, X>;
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
export function createSwRt(): RouteChainInit {
    return {
        /**
         * Add first route to the switcher.
         * 
         * @param pattern a matching pattern
         * @param handler a handler dealing with the route
         * @returns a router chain.
         */
        route: (pattern, handler) => {
            type R = ReturnType<typeof handler>;
            let routes = [createRoute(pattern, handler)];
            /**
             * Handler the request when no routes matched 
             * 
             * @param handler a handler receives url and return value
             * @returns object only contains the switcher
             */
            const fallback: RouteChainFallback<R> = (handler) => ({
                switcher: url => createSwitcher(...routes)(url) ?? handler(url)
            });
            /**
             * Add another route to the switcher.
             * 
             * @param pattern a matching pattern
             * @param handler a handler dealing with the route
             * @returns a router chain.
             */
            const route: RouteChainAdder<R> = (pattern, handler) => {
                routes = [...routes, createRoute(pattern, handler)];
                return { route, switcher: createSwitcher(...routes), fallback };
            };
            return { route, switcher: createSwitcher(...routes), fallback };
        }
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
export function createExtendSwRt(): ExtendRouteChainInit {
    return {
        /**
         * Add first extend route to the switcher.
         * 
         * @param pattern a matching pattern
         * @param handler a handler dealing with the route
         * @returns a router chain.
         */
        route: (pattern, handler) => {
            type R = ReturnType<typeof handler>;
            type X = Parameters<typeof handler>[2];
            let routes = [createExtendRoute(pattern, handler)];
            /**
             * Handler the request when no routes matched 
             * 
             * @param handler a handler receives url and return value
             * @returns object only contains the switcher
             */
            const fallback: ExtendRouteChainFallback<R, X> = handler => {
                return {
                    switcher: (url, extra) => createExtendSwitcher(...routes)(url, extra) ?? handler(url, extra)
                };
            };
            /**
             * Add another extend route to the switcher.
             * 
             * @param pattern a matching pattern
             * @param handler a handler dealing with the route
             * @returns a router chain.
             */
            const route: ExtendRouteChainAdder<R, X> = (pattern, handler) => {
                routes = [...routes, createExtendRoute(pattern, handler)];
                return { route, fallback, switcher: createExtendSwitcher(...routes) };
            };
            return {
                route, fallback, switcher: createExtendSwitcher(...routes)
            };
        }
    };
}