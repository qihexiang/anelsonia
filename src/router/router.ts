import { pathToRegexp, Key } from "path-to-regexp";
import { ExtendRouteHandler, RouteHandler, RouteParams } from "../usr/Route";

/**
 * Create a router match specified path.
 * 
 * @param path The path to match given url
 * @returns return a routeMatcher
 */
export function createRouter(path: string) {
    const keys: Key[] = [];
    const pathRegExp = pathToRegexp(path, keys);
    function matcher<Rt>(url: string): { pathParams: RouteParams, searchParams: URLSearchParams; } | null;
    function matcher<Rt>(url: string, handler: RouteHandler<Rt>): Rt | null;
    function matcher<Rt, Ex>(url: string, handler: ExtendRouteHandler<Rt, Ex>, extraArgs: Ex): Rt | null;
    /**
     * Match the url and return the result of the handler.
     * 
     * @param url The requested url.
     * @param handler The handler to handle this route.
     * @returns returns what the handler return.
     */
    function matcher<Rt, Ex>(url: string, handler?: RouteHandler<Rt> | ExtendRouteHandler<Rt, Ex>, extraArgs?: Ex): { pathParams: RouteParams, searchParams: URLSearchParams; } | Rt | null {
        const { pathname, searchParams } = new URL(url, "http://localhost");
        const pathParsed = pathRegExp.exec(pathname);
        if (pathParsed === null) return null;
        const pathParams: RouteParams = new Map();
        keys.forEach((key, index) => {
            pathParams.set(key.name, pathParsed[index + 1]);
        });
        // return handler(pathParams, searchParams);
        if (!handler) return { pathParams, searchParams };
        if (handler.length === 3 && extraArgs !== undefined) {
            const routerHandler = handler as ExtendRouteHandler<Rt, Ex>;
            return routerHandler(pathParams, searchParams, extraArgs);
        }
        const routerHandler = handler as RouteHandler<Rt>;
        return routerHandler(pathParams, searchParams);
    };
    return matcher;
}
