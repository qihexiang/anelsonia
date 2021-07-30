import { HalfExtendRouter, Router } from "./types";

export function hubRoutes<T>(...routes: Router<T>[]): Router<T> {
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