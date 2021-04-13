export type RouteParams = Map<string | number, string>;

export interface RouteHandler<Rt> {
    (
        pathParams: RouteParams,
        searchParams: URLSearchParams,
    ): Rt;
}

export interface ExtendRouteHandler<Rt, Ex> {
    (
        pathParams: RouteParams,
        searchParams: URLSearchParams,
        extraArgs: Ex
    ): Rt;
}