import { AsyncLocalStorage } from "async_hooks";
import destroy from "destroy";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Stream } from "stream";
import { createRes, ResponseProps } from ".";
import { Route } from "..";

export type HttpReq = IncomingMessage | Http2ServerRequest;
export type HttpRes = ServerResponse | Http2ServerResponse;
export type ReqHandler = (req: HttpReq, res: HttpRes) => void;
export type EntryPoint = (req: HttpReq) => Promise<ResponseProps>;

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
export function useURL(): {
    host: string;
    path: string;
    query: URLSearchParams;
};
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
export function useURL<T>(prop?: "path" | "host" | "query" | Route<T>) {
    const req = requests.getStore();
    if (req === undefined)
        throw new Error(
            "Can't get request, is this function called by main function?"
        );
    const host = req.headers.host ?? "localhost";
    if (prop === "host") return host;
    const path = req.url ?? "/";
    if (prop === "path") return path;
    const url = new URL(path, `http://${host}`);
    if (prop === "query") return url.searchParams;
    if (prop === undefined) return { host, path, query: url.searchParams };
    return prop(path);
}

interface CreateFlare {
    <T>(): [(value: T) => void, () => Readonly<T>, () => void];
    <T>(options: { mutable: true; reassign: boolean }): [
        (value: T) => void,
        () => T,
        () => void
    ];
    <T>(options: { mutable: false; reassign: boolean }): [
        (value: T) => Readonly<void>,
        () => T,
        () => void
    ];
}

/**
 * Create a flare and return handle functions.
 *
 * @param options `{ mutable: boolean, reassign: boolean }` define it this flare mutable and reassignable
 * @returns `[light, observe, extinguish]`
 * - `light`  assign value to the flare
 * - `observe` get the value from the flare
 * - `extinguish` remove the value from the flare
 */
export const createFlare: CreateFlare = <T>(
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
    const light = (value: T) => {
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
    const extinguish = () => {
        if (!values.delete(getReq()))
            throw new Error("No value assigned to this flare found.");
    };
    return [light, observe, extinguish];
};

/**
 * Transform an entry function to Node.js HTTP request handler
 *
 * @param entry a function receives request object and return a reponse object.
 * @param extraOptions {errHandler, maxTimeout}
 * - errHandler is a function that can handler errors on request,
 * - maxTimeout is the longest timeout for a response handling, unit is ms.
 * @returns a handler function for Node.js `http`、`https`、`http2` modules
 */
export function shimHTTP(
    entry: EntryPoint,
    extraOptions?: {
        errHandler?: (err: any) => void;
        maxTimeout?: number;
    }
): ReqHandler {
    const {
        errHandler = (err: any) => console.error(err),
        maxTimeout = 30 * 1000,
    } = extraOptions ?? {};
    if (!Number.isInteger(maxTimeout))
        throw new Error("maxTimeout property must be an integer");
    return async (req, res) => {
        requests.run(req, async () => {
            try {
                const { statusCode, statusMessage, body, headers } =
                    await Promise.race([
                        entry(req),
                        new Promise<ResponseProps>((resolve) =>
                            setTimeout(
                                () => resolve(createRes(408)),
                                maxTimeout
                            )
                        ),
                    ]);
                if (res instanceof IncomingMessage)
                    res.writeHead(statusCode, statusMessage, headers);
                res.writeHead(statusCode, headers);
                if (body instanceof Stream) {
                    body.pipe(res);
                    body.on("error", (err) => {
                        if (errHandler !== undefined) errHandler(err);
                        res.end();
                    });
                    res.on("finish", () => {
                        destroy(body);
                    });
                } else {
                    body ? res.end(body as Buffer | string) : res.end();
                }
            } catch (err) {
                if (errHandler !== undefined) errHandler(err);
                res.end();
            }
        });
    };
}
