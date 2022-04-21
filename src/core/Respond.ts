import { MaybePromise } from "../utils";
import StatusCode from "./Status";

/**
 * Describe http status. Follow patterns are valid:
 *
 * - A number as status code like `200`
 * - A tuple with status code and status message like `[200, "Ok"]`
 */
export type Status = StatusCode | [StatusCode, string];
/**
 * Describe http headers in an object, like:
 *
 * ```ts
 * {
 *     "Content-Type": "application/json",
 *     "Content-Length": "16"
 * }
 * ```
 */
export type HttpHeader = { [headerName: string]: string | string[] };
/**
 * A tuple that can describe a http response. `[body, status, ...httpHeaders]`.
 * If body is undefined, server will response nothing.
 */
export type Respond<T> = [T | undefined, Status, ...HttpHeader[]];
export type Trasnformer<T, N> = (
    body: T | undefined,
    status: Status,
    headers: HttpHeader[]
) => MaybePromise<Respond<N>>;

/**
 * Create a Respond with a body.
 * @param body
 */
export function response<T>(body: T | undefined): Respond<T>;
/**
 * Create a Respond with a body and status definition
 * @param body
 * @param status
 */
export function response<T>(body: T | undefined, status: Status): Respond<T>;
/**
 * Create a Respond with a body, status definitions and specify some headers.
 *
 * @param body
 * @param status
 * @param headers
 */
export function response<T>(
    body: T | undefined,
    status: Status,
    ...headers: HttpHeader[]
): Respond<T>;
/**
 * Attach headers to a Respond
 *
 * @param res
 * @param headers
 */
export function response<T>(
    res: Respond<T>,
    ...headers: HttpHeader[]
): Respond<T>;
/**
 * Convert the body type of a Respond
 *
 * @param res
 * @param transformer
 */
export function response<T, N>(
    res: Respond<T>,
    transformer: (
        body: T | undefined,
        status: Status,
        headers: HttpHeader[]
    ) => Respond<N>
): Respond<N>;
/**
 * Convert the body type of a Respond with an asynchronous function
 *
 * @param res
 * @param transformer
 */
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
