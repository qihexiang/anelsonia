import { AsyncLocalStorage } from "async_hooks";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Readable } from "stream";
import MaybePromise from "../utils/MaybePromise";
import { Respond } from "./respond";

/**
 * HttpReq is the request parameter of http or http2 request handler
 */
export type HttpReq = IncomingMessage | Http2ServerRequest;
/**
 * HttpRes is the response parameter of http or http2 request handler
 */
export type HttpRes = ServerResponse | Http2ServerResponse;
/**
 * Request handler function of http or http2 module
 */
export type ReqHandler = (req: HttpReq, res: HttpRes) => void;
/**
 * BasicRespond is a Respond of binary-like (string, Uint8Array and Readable stream) body
 */
export type BasicRespond = Respond<string | Uint8Array | Readable>;
/**
 * Request handler function of Freesia
 */
export type EntryPoint = (req: HttpReq) => MaybePromise<BasicRespond>;

export const requests = new AsyncLocalStorage<HttpReq>();

/**
 * Transform an entry function to Node HTTP request handler
 *
 * @param entry a function receives request object and return a reponse object.
 * @param extraOptions {errHandler, longestConnection}
 * - errHandler is a function that can handler errors on request,
 * - longestConnection is the longest timeout for a response handling and transporting, unit is ms.
 * @returns a handler function for Node `http`、`https`、`http2` modules
 */
export function freesia(
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
