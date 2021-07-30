type NamedRegExpStr<N extends string> = `(?<${N}>${string})`;
type RouteParam<L extends string, R extends string> = `${L}/${R}`;

export type RouteSchema<P extends string> = P extends RouteParam<infer L, infer R> ? L extends NamedRegExpStr<infer N> ?
    { [propName in N | keyof RouteSchema<R>]: string } : { [propName in keyof RouteSchema<R>]: string } :
    P extends NamedRegExpStr<infer N> ? { [propName in N]: string; } : {};

export type Router<T> = (url: string) => T | null;

export type RouteHandler<P extends string, T> = (matched: RouteSchema<P>) => T;
export type ExtendedRouteHandler<P extends string, T, X> = (matched: RouteSchema<P>, extraArgs: X) => T;
export type HalfExtendRouter<T, X> = (extraArgs: X) => Router<T>;

export type RouterChain<T> = {
    match: <P extends string>(pathname: P, handler: RouteHandler<P, T>) => RouterChain<T>;
    route: Router<T>;
};


export interface ConditionCallback<T> {
    (condition: string): T;
}

export interface Condition<T> {
    match: (condition: string, callback: ConditionCallback<T>) => Condition<T>;
    getResult: () => T | null;
}
