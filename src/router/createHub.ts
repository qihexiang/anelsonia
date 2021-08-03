import { HalfExtendRouter, Route } from "./types";

export function hubRoutes<T>(...routes: Route<T>[]): Route<T> {
    return (url: string) => {
        return routes.reduce<T | null>((result, current) => {
            return result ?? current(url);
        }, null);
    };
}

export function hubExtendRoutes<T, X>(extraArgs: X, ...routes: HalfExtendRouter<T, X>[]) {
    return (url: string) => {
        return routes.reduce<T | null>((result, current) => {
            return result ?? current(extraArgs)(url);
        }, null);
    };
}