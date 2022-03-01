import { HttpReq } from "../core/shimHTTP.ts";
import { RouteHandlerX } from "./createRoute.ts";

const allowMethods = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
    methods: string[],
): RouteHandlerX<P, HttpReq, R | null> => {
    return (params, req) => {
        if (!methods.includes(req.method ?? "UNKNOWN")) return null;
        return handler(params, req);
    };
};

export const All = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, [
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
export const Get = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["GET"]);
export const Head = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["HEAD"]);
export const Post = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["POST"]);
export const Put = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["PUT"]);
export const Delete = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["DELETE"]);
export const Connect = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["CONNECT"]);
export const Options = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["OPTIONS"]);
export const Trace = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["TRACE"]);
export const Patch = <P extends string, R>(
    handler: RouteHandlerX<P, HttpReq, R>,
) => allowMethods(handler, ["PATCH"]);
