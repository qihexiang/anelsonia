import { pathToRegexp, Key } from "path-to-regexp";
import { RouteHandler, RouteParams } from "../usr/Route";

/**
 * Create a router match specified path.
 * 
 * @param path The path to match given url
 * @returns return a routeMatcher
 */
export function createRouter(path: string) {
    const keys: Key[] = [];
    const pathRegExp = pathToRegexp(path, keys);
    /**
     * Match the url and return the result of the handler.
     * 
     * @param url The requested url.
     * @param handler The handler to handle this route.
     * @returns returns what the handler return.
     */
    function matcher<T>(url: string, handler: RouteHandler<T>) {
        const { pathname, searchParams } = new URL(url, "http://localhost");
        const pathParsed = pathRegExp.exec(pathname);
        if (pathParsed === null) return null;
        const pathParams: RouteParams = new Map();
        keys.forEach((key, index) => {
            pathParams.set(key.name, pathParsed[index + 1]);
        });
        return handler(pathParams, searchParams);
    };
    return matcher;
}

/**
 * Return pathParams and searchParams back.
 */
export const getParams: RouteHandler<{ pathParams: RouteParams, searchParams: URLSearchParams; }> = (p, q) => {
    return { pathParams: p, searchParams: q };
};
