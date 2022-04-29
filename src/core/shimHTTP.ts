import { AsyncLocalStorage } from "async_hooks";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Readable } from "stream";
import { Route } from "../router/createRoute";
import MaybePromise from "../utils/MaybePromise";
import { Respond } from "./Respond";

export type HttpReq = IncomingMessage | Http2ServerRequest;
export type HttpRes = ServerResponse | Http2ServerResponse;
export type BasicRespond = MaybePromise<
    Respond<string | Uint8Array | Readable>
>;
export type ReqHandler = (req: HttpReq, res: HttpRes) => void;
export type EntryPoint = (req: HttpReq) => BasicRespond;

const requests = new AsyncLocalStorage<HttpReq>();

/**
 * Get `HttpReq` from anywhere called by callback of shimHTTP
 *
 * @returns `HttpReq` object
 */
export const useRequest = () => {
    const req = requests.getStore();
    if (req === undefined)
        throw new Error(
            "Can't get request, is this function called by main function?"
        );
    return req;
};

/**
 * Get host, path and query object from the request.
 */
export function useURL(): URL;

/**
 * Get request method.
 *
 * @param prop method
 */
export function useURL(prop: "method"): string;
/**
 * Get request path from the request.
 *
 * @param prop path
 */
export function useURL(prop: "path"): string;
/**
 * Get hostname from the request.
 *
 * @param prop host
 */
export function useURL(prop: "host"): string;
/**
 * Get the search params from the ruquest.
 *
 * @param prop query
 */
export function useURL(prop: "query"): URLSearchParams;
/**
 * Get the route result from the router
 *
 * @param prop the router you want to use
 */
export function useURL<T>(prop: (url: string) => T): T;
export function useURL<T>(
    prop?: "path" | "host" | "query" | "method" | Route<T>
) {
    const req = requests.getStore();
    if (req === undefined)
        throw new Error(
            "Can't get request, is this function called by main function?"
        );
    const method = req.method ?? "GET";
    if (prop === "method") return method;
    const host = req.headers.host ?? "localhost";
    if (prop === "host") return host;
    const path = req.url ?? "/";
    if (prop === "path") return path;
    const url = new URL(path, `http://${host}`);
    if (prop === "query") return url.searchParams;
    if (prop === undefined) return url;
    return prop(url.pathname);
}

interface CreateContext {
    <T>(): [(value: T) => void, () => Readonly<T>, () => void];
    <T>(options: { mutable: true; reassign: boolean }): [
        (value: T) => void,
        () => T,
        () => void
    ];
    <T>(options: { mutable: false; reassign: boolean }): [
        (value: T) => void,
        () => Readonly<T>,
        () => void
    ];
}

/**
 * Create a flare and return handle functions.
 *
 * @param options `{ mutable: boolean, reassign: boolean }` define it this flare mutable and reassignable
 * @returns `[light, observe, extinguish]`
 * - `assign`  assign value to the flare
 * - `observe` get the value from the flare
 * - `drop` remove the value from the flare
 */
export const createContext: CreateContext = <T>(
    options = {
        mutable: false,
        reassign: false,
    }
) => {
    const { reassign } = options;
    const getReq = () => {
        const result = requests.getStore();
        if (result === undefined)
            throw new Error("Can't get symbol of this request.");
        return result;
    };
    const values = new WeakMap<HttpReq, T>();
    /**
     * Assign or re-assign a value to this flare
     *
     * @param value the value you want to assign to flare
     */
    const assign = (value: T) => {
        const req = getReq();
        if (!reassign && values.has(req))
            throw new Error("Already has a value and not re-assignable.");
        values.set(req, value);
    };
    /**
     * Get value from the flare.
     *
     * @returns the value assgined to the flare
     */
    const observe = () => {
        const value = values.get(getReq());
        if (value === undefined)
            throw new Error("No value has been assigned to this flare.");
        return value;
    };
    /**
     * Remove the value from the flare.
     */
    const drop = () => {
        if (!values.delete(getReq()))
            throw new Error("No value assigned to this flare found.");
    };
    return [assign, observe, drop] as [(value: T) => void, () => T, () => void];
};

/**
 * Transform an entry function to Node HTTP request handler
 *
 * @param entry a function receives request object and return a reponse object.
 * @param extraOptions {errHandler, longestConnection}
 * - errHandler is a function that can handler errors on request,
 * - longestConnection is the longest timeout for a response handling and transporting, unit is ms.
 * @returns a handler function for Node `http`、`https`、`http2` modules
 */
export function shimHTTP(
    entry: EntryPoint,
    extraOptions?: {
        errHandler?: (err: any) => void;
        longestConnection?: number;
    }
): ReqHandler {
    return (req, res) =>
        requests.run(req, getResponser(req, res, entry, extraOptions ?? {}));
}

function getResponser(
    req: HttpReq,
    res: HttpRes,
    entry: EntryPoint,
    extraOptions: {
        longestConnection?: number;
        errHandler?: (err: any) => void;
    }
): () => Promise<void> {
    const { longestConnection, errHandler } = extraOptions;
    return async () => {
        let connectionTimer: number | undefined;
        if (longestConnection !== undefined)
            connectionTimer = setTimeout(() => res.end(), longestConnection)[
                Symbol.toPrimitive
            ]();
        try {
            const [body, status, ...headers] = await entry(req);
            const statusCode = status instanceof Array ? status[0] : status;
            const statusText = status instanceof Array ? status[1] : undefined;
            const httpHeader = headers.reduce((current, next) => {
                return { ...current, ...next };
            }, {});
            if (statusText === undefined) res.writeHead(statusCode, httpHeader);
            else res.writeHead(statusCode, statusText, httpHeader);
            if (body instanceof Readable) {
                body.pipe(res);
                body.on("error", (err) => {
                    if (errHandler !== undefined) errHandler(err);
                    res.end(() => clearTimeout(connectionTimer));
                });
                res.on("finish", () => {
                    clearTimeout(connectionTimer);
                    body.destroy();
                });
            } else {
                clearTimeout(connectionTimer);
                body === undefined ? res.end() : res.end(body);
            }
        } catch (err) {
            if (errHandler !== undefined) errHandler(err);
            res.end(() => clearTimeout(connectionTimer));
        }
    };
}
