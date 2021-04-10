export type RouteParams = Map<string | number, string>;
export interface RouteHandler<Rt, Ex> {
    (
        pathParams: RouteParams,
        searchParams: URLSearchParams,
        otherArgs?: Ex
    ): Rt;
}