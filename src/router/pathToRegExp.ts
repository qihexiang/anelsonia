import { Empty } from "./params";

type Merge<T, E> = Omit<T, keyof E> & E;

type Delimeter = "(" | "/" | "-" | "*" | "?" | "+";

type TakeRight<
    R extends string,
    L extends string | undefined = undefined
> = L extends `${string}(${infer LInner}`
    ? R extends `${infer RInner})${infer ROuter}`
        ? TakeRight<ROuter, `${LInner}${RInner}`>
        : never
    : L extends undefined
    ? R extends `${infer Left})${infer Right}`
        ? TakeRight<`)${Right}`, Left>
        : R
    : R extends `)${string}}`
    ? never
    : R;

type RemoveFlower<T extends string> = T extends `${infer N}}` ? N : T;

/**
 * Route params type for path-to-regexp.
 */
export type RouteParams<Path extends string> =
    Path extends `${string}:${infer Next}`
        ? Next extends `${infer Name}(${string}`
            ? Name extends `${string}${Delimeter}${string}`
                ? Merge<
                      RouteParams<`:${Name}`>,
                      RouteParams<TakeRight<Next>>
                  >
                : Merge<
                      {
                          [key in RemoveFlower<Name>]: string;
                      },
                      RouteParams<TakeRight<Next>>
                  >
            : Next extends `${infer Name}*${infer Rest}`
            ? Name extends `${string}${Delimeter}${string}`
                ? Merge<RouteParams<`:${Name}`>, RouteParams<Next>>
                : Merge<
                      {
                          [key in RemoveFlower<Name>]: string[];
                      },
                      RouteParams<Rest>
                  >
            : Next extends `${infer Name}?${infer Rest}`
            ? Name extends `${string}${Delimeter}${string}`
                ? Merge<RouteParams<`:${Name}`>, RouteParams<Next>>
                : Merge<
                      {
                          [key in RemoveFlower<Name>]: string | undefined;
                      },
                      RouteParams<Rest>
                  >
            : Next extends `${infer Name}+${infer Rest}`
            ? Name extends `${string}${Delimeter}${string}`
                ? Merge<RouteParams<`:${Name}`>, RouteParams<Next>>
                : Merge<
                      {
                          [key in RemoveFlower<Name>]: string;
                      },
                      RouteParams<Rest>
                  >
            : Next extends `${infer Name}-${infer Rest}`
            ? Name extends `${string}${Delimeter}${string}`
                ? Merge<RouteParams<`:${Name}`>, RouteParams<Next>>
                : Merge<
                      {
                          [key in RemoveFlower<Name>]: string;
                      },
                      RouteParams<Rest>
                  >
            : Next extends `${infer Name}/${infer Rest}`
            ? Name extends `${string}${Delimeter}${string}`
                ? Merge<RouteParams<`:${Name}`>, RouteParams<Next>>
                : Merge<
                      {
                          [key in RemoveFlower<Name>]: string;
                      },
                      RouteParams<Rest>
                  >
            : {
                  [key in RemoveFlower<Next>]: string;
              }
        : Empty;
