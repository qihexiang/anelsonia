import { pathToRegexp, Key } from "path-to-regexp";
import { RouteHandler, RouteParams } from "../usr/Route";

/**
 * Generate a route-match function.
 * 
 * @param pathToMatch path-to-regexp styled string
 */
export function router(pathToMatch: string) {
    const keys: Key[] = [];
    const pathRegExp = pathToRegexp(pathToMatch, keys);
    return {
        /**
         * Match the url with route RegExp.
         * 
         * @param reqUrl The requested url, you can use `req.url` or anything you want.
         * @returns `{ handleBy }` if matched and `null` if not.
         */
        match(reqUrl: string) {
            const { pathname, searchParams } = new URL(reqUrl, 'http://localhost');
            const pathParsed = pathRegExp.exec(pathname);
            if (pathParsed === null) return null;
            const pathParams: RouteParams = new Map();
            keys.forEach((key, index) => {
                pathParams.set(key.name, pathParsed[index + 1]);
            });
            return {
                /**
                 * handle condition when route matched.
                 * 
                 * @param handler The RouteHandler you want to use to handle this condition.
                 * @returns what the `handler` returns
                 */
                handleBy: function <T>(handler: RouteHandler<T>): T {
                    return handler(pathParams, searchParams);
                },
                pathParams, searchParams
            };
        }
    };
}