import { MaybePromise } from "../utils";
import StatusCode from "./Status";

export type Status = StatusCode | [StatusCode, string];
export type HttpHeader = { [headerName: string]: string | string[] };
export type Respond<T> = [T | undefined, Status, ...HttpHeader[]];
export type Trasnformer<T, N> = (
    body: T | undefined,
    status: Status,
    headers: HttpHeader[]
) => MaybePromise<Respond<N>>;

export function response<T>(body: T | undefined): Respond<T>;
export function response<T>(body: T | undefined, status: Status): Respond<T>;
export function response<T>(
    body: T | undefined,
    status: Status,
    ...headers: HttpHeader[]
): Respond<T>;
export function response<T>(
    res: Respond<T>,
    ...headers: HttpHeader[]
): Respond<T>;
export function response<T, N>(
    res: Respond<T>,
    transformer: (
        body: T | undefined,
        status: Status,
        headers: HttpHeader[]
    ) => Respond<N>
): Respond<N>;
export function response<T, N>(
    res: Respond<T>,
    transformer: (
        body: T | undefined,
        status: Status,
        headers: HttpHeader[]
    ) => Promise<Respond<N>>
): Promise<Respond<N>>;
export function response<T, N>(
    arg1: T | undefined | Respond<T>,
    arg2?: Status | Trasnformer<T, N> | HttpHeader,
    ...headers: HttpHeader[]
) {
    if (arguments.length === 1) {
        const body = arg1 as T | undefined;
        return [body, body === undefined ? 204 : 200];
    }
    if (arguments.length === 2) {
        if (typeof arg2 === "function") {
            const res = arg1 as Respond<T>;
            const transformer = arg2;
            const [body, status, ...headers] = res;
            return transformer(body, status, headers);
        } else if (typeof arg2 === "number" || arg2 instanceof Array) {
            const body = arg1 as T | undefined;
            const status = arg2 as Status;
            return [body, status];
        } else {
            const res = arg1 as Respond<T>;
            const header = arg2 as HttpHeader;
            return [...res, header];
        }
    }
    if (arguments.length >= 3) {
        if (typeof arg2 === "number" || arg2 instanceof Array) {
            const body = arg1 as T | undefined;
            const status = arg2 as Status;
            return [body, status, ...headers];
        } else {
            const res = arg1 as Respond<T>;
            return [...res, arg2 as HttpHeader, ...headers];
        }
    }
    throw new Error("Invalid given arguments.");
}
