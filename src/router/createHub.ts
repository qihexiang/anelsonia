import { HalfExtendRouter, Router } from "./types";

export function createHub<T>(...routes: Router<T>[]): Router<T> {
    return (url: string) => {
        return routes.reduce<T | null>((result, current) => {
            return result ?? current(url);
        }, null);
    };
}

export function createExtendRtHub<T, X>(extraArgs: X, ...routes: HalfExtendRouter<T, X>[]) {
    return (url: string) => {
        return routes.reduce<T | null>((result, current) => {
            return result ?? current(extraArgs)(url);
        }, null);
    };
}