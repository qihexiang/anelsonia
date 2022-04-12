export type Empty = Record<never, never>;

type NonGreedy<T extends string> = `:<${T}>`;
type GreedyAtLeastOne<T extends string> = `:{${T}}`;
type GreedyAtLeastZero<T extends string> = `:[${T}]`;
type GreedyAtLeastZeroRemoveSlash<T extends string> = `:(${T})`;
export type ParamFlag<T extends string> =
    | NonGreedy<T>
    | GreedyAtLeastOne<T>
    | GreedyAtLeastZero<T>
    | GreedyAtLeastZeroRemoveSlash<T>;
export type RoutePattern<L extends string, R extends string> = `${L}/${R}`;
export type RouteParam<U extends string> = U extends RoutePattern<
    infer L,
    infer R
>
    ? L extends ParamFlag<infer T>
        ? {
              [key in T]: L extends GreedyAtLeastZeroRemoveSlash<infer _N>
                  ? string | undefined
                  : string;
          } & RouteParam<R>
        : RouteParam<R>
    : U extends ParamFlag<infer T>
    ? {
          [key in T]: U extends GreedyAtLeastZeroRemoveSlash<infer _N>
              ? string | undefined
              : string;
      }
    : Empty;
