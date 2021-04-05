export type RouteParams = Map<string | number, string>;
export interface RouteHandler<T> {
    (pathParams: RouteParams, searchParams: URLSearchParams, ...otherArgs: any[]): T;
}