export type Empty = Record<never, never>;
/**
 * Pattern `<T>` matches with symbol +, which means there must be at least one character,
 * Pattern <[T]> matches with symbol + like pattern `<T>`, but it's greedy.
 * Pattern [T] matches with symbol *, which means there can be 0 character, it's greedy too.
 */
export type ParamFlag<T extends string> = `[${T}]` | `<[${T}]>` | `<${T}>`;
export type RoutePattern<L extends string, R extends string> = `${L}/${R}`;
export type RouteParam<U extends string> = U extends RoutePattern<
    infer L,
    infer R
> ? L extends ParamFlag<infer T> ? Record<T | keyof RouteParam<R>, string>
: Record<keyof RouteParam<R>, string>
    : U extends ParamFlag<infer T> ? Record<T, string>
    : Empty;
