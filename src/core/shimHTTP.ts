import { AsyncLocalStorage } from "async_hooks";
import destroy from "destroy";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Stream } from "stream";
import { AsyncResponse } from "./Respond";

export type HttpReq = IncomingMessage | Http2ServerRequest;
export type HttpRes = ServerResponse | Http2ServerResponse;
export type ReqHandler = (req: HttpReq, res: HttpRes) => void;
export type EntryPoint = (req: HttpReq) => AsyncResponse;

const requests = new AsyncLocalStorage<HttpReq>();

/**
 * Get `HttpReq` from anywhere called by callback of shimHTTP
 * 
 * @returns `HttpReq` object
 */
export const useRequest = () => {
    const req = requests.getStore();
    if (req === undefined) throw new Error("Can't get request, is this function called by main function?");
    return req;
};

interface CreateFlare {
    <T>(): [(value: T) => void, () => Readonly<T>, () => void];
    <T>(options: { mutable: true, reassign: boolean; }): [(value: T) => void, () => T, () => void];
    <T>(options: { mutable: false, reassign: boolean; }): [(value: T) => Readonly<void>, () => T, () => void];
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
export const createFlare: CreateFlare = <T>(options = {
    mutable: false, reassign: false
}) => {
    const { reassign } = options;
    const getReq = () => {
        const result = requests.getStore();
        if (result === undefined) throw new Error("Can't get symbol of this request.");
        return result;
    };
    const values = new WeakMap<{}, T>();
    const light = (value: T) => {
        const req = getReq();
        if (!reassign && values.has(req)) throw new Error("Value of this request is already on bridge.");
        values.set(req, value);
    };
    const observe = () => {
        const value = values.get(getReq());
        if (value === undefined) throw new Error("No value of this request is on bridge.");
        return value;
    };
    const extinguish = () => {
        if (!values.delete(getReq())) throw new Error("No value of this request is on bridge.");
    };
    return [light, observe, extinguish];
};

/**
 * Transform an entry function to Node.js HTTP request handler
 * 
 * @param entry a function receives request object and return a reponse object.
 * @param errHandler handler for dealing with errors
 * @returns a handler function for Node.js `http`、`https`、`http2` modules
 */
export function shimHTTP(entry: EntryPoint, errHandler?: (err: any) => void): ReqHandler {
    return async (req, res) => {
        requests.run(req, async () => {
            try {
                const { statusCode, statusMessage, body, headers } = await entry(req);
                if (res instanceof IncomingMessage) res.writeHead(statusCode, statusMessage, headers);
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
