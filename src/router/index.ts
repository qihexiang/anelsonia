import { IncomingMessage } from "http";

type NamedRegExpStr<N extends string> = `(?<${N}>${string})`;
type RouteParam<L extends string, R extends string> = `${L}/${R}`;
export type RouteSchema<P extends string> = P extends RouteParam<infer L, infer R> ? L extends NamedRegExpStr<infer N> ?
    { [propName in N | keyof RouteSchema<R>]: string } : { [propName in keyof RouteSchema<R>]: string } :
    P extends NamedRegExpStr<infer N> ? { [propName in N]: string; } : {};
export type RouteHandler<P extends string, T> = (matched: RouteSchema<P>) => T;
export type ExtendedRouteHandler<P extends string, T, X> = (matched: RouteSchema<P>, extraArgs: X) => T;
export type Router<T> = (url: string) => T | null;
export type HalfExtendRouter<T, X> = (extraArgs: X) => Router<T>;

export function createRouter<P extends string, T>(pathname: P, handler: RouteHandler<P, T>): Router<T> {
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

export function createHalfExtendRouter<P extends string, T, X = IncomingMessage>(pathname: P, handler: ExtendedRouteHandler<P, T, X>): HalfExtendRouter<T, X> {
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

export function routerHub<T>(...routes: Router<T>[]): Router<T> {
    return (url: string) => {
        return routes.reduce<T | null>((result, current) => {
            return result ?? current(url);
        }, null);
    };
}