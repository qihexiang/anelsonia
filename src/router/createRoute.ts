import { ExtendedRouteHandler, HalfExtendRouter, RouteHandler, Router, RouteSchema } from "./types";

export function createRoute<P extends string, T>(pathname: P, handler: RouteHandler<P, T>): Router<T> {
    const re = new RegExp(pathname);
    function match(url: string): T | null {
        const result = url.match(re);
        if (result) {
            const groups = result.groups as RouteSchema<P>;
            return handler(groups);
        }
        return null;
    }
    return match;
}

export function createHalfExtendRoute<P extends string, T, X>(pathname: P, handler: ExtendedRouteHandler<P, T, X>): HalfExtendRouter<T, X> {
    return (extraArgs: X) => {
        const re = new RegExp(pathname);
        function match(url: string) {
            const result = url.match(re);
            if (result) {
                const groups = result.groups as RouteSchema<P>;
                return handler(groups, extraArgs);
            }
            return null;
        }
        return match;
    };
}
