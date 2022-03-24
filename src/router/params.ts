export type Empty = Record<never, never>;
/**
 * Pattern `<T>` matches with symbol +, which means there must be at least one character,
 * Pattern `{T}` matches with symbol + like pattern `<T>`, but it's greedy.
 * Pattern `[T]` matches with symbol *, which means there can be 0 character, it's greedy too.
 * Pattern `[?T]` matches with symbol *, while `/` before it can be not existed if it's empty.
 */
type NonGreedy<T extends string> = `:<${T}>`;
type GreedyAtLeastOne<T extends string> = `:{${T}}`;
type GreedyAtLeastZero<T extends string> = `:[${T}]`;
type GreedyAtLeastZeroRemoveSlash<T extends string> = `:(${T})`;
export type ParamFlag<T extends string> = NonGreedy<T> | GreedyAtLeastOne<T> | GreedyAtLeastZero<T> | GreedyAtLeastZeroRemoveSlash<T>;
export type RoutePattern<L extends string, R extends string> = `${L}/${R}`;
export type RouteParam<U extends string> = U extends RoutePattern<
    infer L,
    infer R
> ? L extends ParamFlag<infer T> ? { [key in T]: L extends GreedyAtLeastZeroRemoveSlash<infer _N> ? string | undefined : string } & RouteParam<R>
    : RouteParam<R>
    : U extends ParamFlag<infer T> ? { [key in T]: U extends GreedyAtLeastZeroRemoveSlash<infer _N> ? string | undefined : string }
    : Empty;

type Example = RouteParam<"/hello/:<username>/:(operation)">;
