import {
    createRoute,
    createRouteX,
    Route,
    RouteHandler,
    RouteHandlerX,
    RouteX,
} from "./createRoute.ts";
import { createSwitcher, createSwitcherX } from "./createSwitcher.ts";

/**
 * The type of createSwRt, which includes a `route` function to registry
 * the first route. This `route` function will define the return type of
 * the created switcher
 */
export type RouteChainInit = {
    route: <R, P extends string>(
        pattern: P,
        handler: RouteHandler<P, R>,
        flags?: string,
    ) => RouteChain<R>;
};
/**
 * The type of `route` method in a `RouteChain<R>`, which
 * will return new `RouteChain<R>`.
 */
export type RouteChainAdder<R> = <P extends string>(
    pattern: P,
    handler: RouteHandler<P, R>,
    flags?: string,
) => RouteChain<R>;
/**
 * The type of `fallback` method in a `RouteChain<R>`, which
 * will return a object contains a switcher function. This
 * switcher won't return null.
 */
export type RouteChainFallback<R> = (handler: (url: string) => R) => {
    switcher: (url: string) => R;
};
/**
 * An object which includes `route` and `fallback` method, and
 * a switcher function of registried routes.
 */
export type RouteChain<R> = {
    route: RouteChainAdder<R>;
    fallback: RouteChainFallback<NonNullable<R>>;
    switcher: Route<R>;
};

/**
 * The type of createSwRtX, which includes a `route` function to registry
 * the first route. This `route` function will define the return type of
 * the created switcher
 */
export type RouteChainInitX = {
    route: <R, X, P extends string>(
        pattern: P,
        handler: RouteHandlerX<P, X, R>,
        flags?: string,
    ) => RouteChainX<R, X>;
};
/**
 * The type of `route` method in a `RouteChainX<R, X>`, which
 * will return new `RouteChainX<R, X>`.
 */
export type RouteChainAdderX<R, X> = <P extends string>(
    pattern: P,
    handler: RouteHandlerX<P, X, R>,
    flags?: string,
) => RouteChainX<R, X>;
/**
 * The type of `fallback` method in a `RouteChainX<R, X>`, which
 * will return a object contains a switcher function. This
 * switcher won't return null.
 */
export type RouteChainFallbackX<R, X> = (
    handler: (url: string, extra: X) => R,
) => {
    switcher: (url: string, extra: X) => R;
};
/**
 * An object which includes `route` and `fallback` method, and
 * a switcher function of registried routes.
 */
export type RouteChainX<R, X> = {
    route: RouteChainAdderX<R, X>;
    fallback: RouteChainFallbackX<NonNullable<R>, X>;
    switcher: RouteX<R, X>;
};

/**
 * create a switcher and registry routes to it. Use like this:
 *
 * ```ts
 * const { switcher } = createSwRt
 *     .route("/hello/<username>/", async ({username}) => createRes(`hello, username`))
 *     .route("/file/<filepath>", async ({filepath}) => createRes(createFileStreamSafely(filepath)))
 *     .fallback(async url => createRes(Status.NotFound, `No route matched ${url}`))
 * ```
 */
export const createSwRt: RouteChainInit = {
    /**
     * Add first route to the switcher.
     *
     * @param pattern a matching pattern
     * @param handler a handler dealing with the route
     * @param flags flags for RegExp, default is 'i'
     * @returns a router chain.
     */
    route: (pattern, handler, flags) => {
        type R = ReturnType<typeof handler>;
        let routes = [createRoute(pattern, handler, flags)];
        /**
         * Handler the request when no routes matched
         *
         * @param handler a handler receives url and return value
         * @returns object only contains the switcher
         */
        const fallback: RouteChainFallback<NonNullable<R>> = (handler) => ({
            switcher: (url) => createSwitcher(...routes)(url) ?? handler(url),
        });
        /**
         * Add another route to the switcher.
         *
         * @param pattern a matching pattern
         * @param handler a handler dealing with the route
         * @param flags flags for RegExp, default is 'i'
         * @returns a router chain.
         */
        const route: RouteChainAdder<R> = (pattern, handler, flags) => {
            routes = [...routes, createRoute(pattern, handler, flags)];
            return { route, switcher: createSwitcher(...routes), fallback };
        };
        return { route, switcher: createSwitcher(...routes), fallback };
    },
};

/**
 * create a switcher with extra parameter and registry routes to it. Use like this:
 *
 * ```ts
 * const { switcher } = createSwRt
 *     .route("/hello/<username>/", async ({username}, req: Request) => createRes(`hello, username, you send ${await req.text()}`))
 *     .route("/file/<filepath>", async ({filepath}, _req) => createRes(createFileStreamSafely(filepath)))
 *     .fallback(async (url, req) => createRes(Status.NotFound, `Can't ${req.method} ${url}`))
 * ```
 */
export const createSwRtX: RouteChainInitX = {
    /**
     * Add first route to the switcher.
     *
     * @param pattern a matching pattern
     * @param handler a handler dealing with the route
     * @param flags flags for RegExp, default is 'i'
     * @returns a router chain.
     */
    route: (pattern, handler, flags) => {
        type R = ReturnType<typeof handler>;
        type X = Parameters<typeof handler>[1];
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
                    createSwitcherX(...routes)(url, extra) ??
                        handler(url, extra),
            };
        };
        /**
         * Add another route to the switcher.
         *
         * @param pattern a matching pattern
         * @param handler a handler dealing with the route
         * @param flags flags for RegExp, default is 'i'
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
