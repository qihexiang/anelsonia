import { RouteHandlerX } from "./createRoute.ts";

/**
 * Wrap a RouteHandlerX whose X parameter is Request, and limit
 * methods of this handler.
 *
 * @param handler the route handler that need to be limited
 * @param methods all methods that can be use with this handler
 * @returns a handler that may return null if methods out of limitation
 */
export function allowMethods<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
    methods: string[],
): RouteHandlerX<P, Request, R> {
    return (params, req) => {
        if (!methods.includes(req.method ?? "UNKNOWN")) return null;
        return handler(params, req);
    };
}

/**
 * Allow GET, HEAD, POST, PUT, DELETE, CONNECT, TRACE, OPTIONS and PATCH.
 * Custom methods will not be allowed. In design, this wrapper just make
 * the handler return type nullable.
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function All<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, [
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "DELETE",
        "CONNECT",
        "OPTIONS",
        "TRACE",
        "PATCH",
    ]);
}
/**
 * Allow GET method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Get<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["GET"]);
}
/**
 * Allow HEAD method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Head<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["HEAD"]);
}
/**
 * Allow POST method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Post<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["POST"]);
}
/**
 * Allow PUT method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Put<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["PUT"]);
}
/**
 * Allow DELETE method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Delete<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["DELETE"]);
}
/**
 * Allow CONNECT method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Connect<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["CONNECT"]);
}
/**
 * Allow OPTIONS method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Options<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["OPTIONS"]);
}
/**
 * Allow TRACE method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Trace<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["TRACE"]);
}
/**
 * Allow PATCH method only
 *
 * @param handler the handler to be wrap.
 * @returns a wrapped handler.
 */
export function Patch<P extends string, R>(
    handler: RouteHandlerX<P, Request, R>,
) {
    return allowMethods(handler, ["PATCH"]);
}
