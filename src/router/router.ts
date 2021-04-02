import { pathToRegexp, Key } from "path-to-regexp";
import { RouteHandler, RouteParams } from "../usr/Route";

export function router(pathToMatch: string) {
    const keys: Key[] = [];
    const pathRegExp = pathToRegexp(pathToMatch, keys);
    return {
        match(reqUrl: string) {
            const { pathname, searchParams } = new URL(reqUrl, 'http://localhost');
            const pathParsed = pathRegExp.exec(pathname)
            if(pathParsed === null) return null
            const pathParams: RouteParams = new Map()
            keys.forEach((key, index) => {
                pathParams.set(key.name, pathParsed[index + 1])
            })
            return {
                handleBy: function<T>(handler: RouteHandler<T>): T | Promise<T> {
                    return handler(pathParams, searchParams)
                }
            }
        }
    };
}