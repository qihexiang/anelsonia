import { ParseOptions, RegexpToFunctionOptions, TokensToRegexpOptions } from "path-to-regexp";
import {
    createRoute,
    createRouteX,
    Route,
    RouteHandler,
    RouteHandlerX,
    RouteX,
} from "./createRoute";
import { createSwitcher, createSwitcherX } from "./createSwitcher";

export type RouteChainInit<R> = {
    route: <P extends string>(
        pattern: P,
        handler: RouteHandler<P, R>,
        options?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions
    ) => RouteChain<R>;
};
export type RouteChainAdder<R> = <P extends string>(
    pattern: P,
    handler: RouteHandler<P, R>,
    options?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions
) => RouteChain<R>;
export type RouteChainFallback<R> = (
    handler: (pathname: string) => R
) => (pathname: string) => R;
export type RouteChain<R> = {
    route: RouteChainAdder<R>;
    fallback: RouteChainFallback<NonNullable<R>>;
    build: () => Route<R>;
};

export type RouteChainInitX<R, X> = {
    route: <P extends string>(
        pattern: P,
        handler: RouteHandlerX<P, X, R>,
        options?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions
    ) => RouteChainX<R, X>;
};
export type RouteChainAdderX<R, X> = <P extends string>(
    pattern: P,
    handler: RouteHandlerX<P, X, R>,
    options?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions
) => RouteChainX<R, X>;
export type RouteChainFallbackX<R, X> = (
    handler: (pathname: string, extra: X) => R
) => (pathname: string, extra: X) => R;
export type RouteChainX<R, X> = {
    route: RouteChainAdderX<R, X>;
    fallback: RouteChainFallbackX<NonNullable<R>, X>;
    build: () => RouteX<R, X>;
};

/**
 * Create a switcher and registry some routes to it.
 * @returns
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
        route: (pattern, handler, options) => {
            let routes = [createRoute(pattern, handler, options)];
            /**
             * Handler the request when no routes matched
             *
             * @param handler a handler receives url and return value
             * @returns object only contains the switcher
             */
            const fallback: RouteChainFallback<NonNullable<R>> =
                (handler) => (url) =>
                    (createSwitcher(...routes)(url) as
                        | NonNullable<R>
                        | null
                        | undefined) ?? handler(url);
            /**
             * Add another route to the switcher.
             *
             * @param pattern a matching pattern
             * @param handler a handler dealing with the route
             * @returns a router chain.
             */
            const route: RouteChainAdder<R> = (pattern, handler, options) => {
                routes = [...routes, createRoute(pattern, handler, options)];
                return {
                    route,
                    build: () => createSwitcher(...routes),
                    fallback,
                };
            };
            return { route, build: () => createSwitcher(...routes), fallback };
        },
    };
}

/**
 * Create a extended switcher and registry some routes to it.
 * @returns
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
        route: (pattern, handler, options) => {
            let routes = [createRouteX(pattern, handler, options)];
            /**
             * Handler the request when no routes matched
             *
             * @param handler a handler receives url and return value
             * @returns object only contains the switcher
             */
            const fallback: RouteChainFallbackX<NonNullable<R>, X> =
                (handler) => (url, extra) =>
                    (createSwitcherX(...routes)(url, extra) as
                        | NonNullable<R>
                        | null
                        | undefined) ?? handler(url, extra);
            /**
             * Add another extend route to the switcher.
             *
             * @param pattern a matching pattern
             * @param handler a handler dealing with the route
             * @returns a router chain.
             */
            const route: RouteChainAdderX<R, X> = (pattern, handler, options) => {
                routes = [...routes, createRouteX(pattern, handler, options)];
                return {
                    route,
                    fallback,
                    build: () => createSwitcherX(...routes),
                };
            };
            return {
                route,
                fallback,
                build: () => createSwitcherX(...routes),
            };
        },
    };
}
