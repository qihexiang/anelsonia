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

const reqSyms = new AsyncLocalStorage<{}>();

/**
 * Create a bridge to pass values to a deeply called function, for example,
 * main -> fileRouter -> uploadRouter -> patchRoute -> patchHandler -> patchService, 
 * you create a buffer from request stream in main, but you just need it in patchService and
 * don't want to thread through the parameters one-by-one, you can do like this:
 * 
 * ```ts
 * // main.ts
 * export const [pushValue, getValue, dropValue] = createBridge<Buffer>();
 * 
 * export const main = async (req: HttpReq) => {
 *     const body = await rawBody(req);
 *     pushValue(body);
 *     ...
 *     const response = fileRouter()
 *     ...
 *     dropValue(body);
 *     return response;
 * }
 * 
 * // patchService.ts
 * import { getValue } from "../main"
 * 
 * export const patchService = () => {
 *     const body = getValue();
 *     ...
 * }
 * ```
 * 
 * @returns [pushValue, getValue, dropValue]
 */
export const createBridge = <T>(): [(value: T) => void, () => T, () => void] => {
    const getSym = () => {
        const result = reqSyms.getStore();
        if (result === undefined) throw new Error("Can't get symbol of this request.");
        return result;
    };
    const values = new WeakMap<{}, T>();
    /**
     * Push a value to this bridge.
     * 
     * @param value the value you'd like to use in deeply called function
     */
    const pushValue = (value: T) => {
        const sym = getSym();
        if (values.has(sym)) throw new Error("Value of this request is already on bridge.");
        values.set(sym, value);
    };
    /**
     * Execute this function to get value from the bridge.
     * 
     * @returns the value you pushed to the bridge.
     */
    const getValue = () => {
        const value = values.get(getSym());
        if (value === undefined) throw new Error("No value of this request is on bridge.");
        return value
    };
    /**
     * Drop the value manually after using it.
     */
    const dropValue = () => {
        if (!values.delete(getSym())) throw new Error("No value of this request is on bridge.");
    };
    return [pushValue, getValue, dropValue];
};

export function shimHTTP(entry: EntryPoint): ReqHandler {
    return async (req, res) => {
        const sym = {};
        reqSyms.run(sym, async () => {
            const { statusCode, statusMessage, body, headers } = await entry(req);
            if (res instanceof IncomingMessage) res.writeHead(statusCode, statusMessage, headers);
            res.writeHead(statusCode, headers);
            if (body instanceof Stream) {
                body.pipe(res);
                body.on("error", (err) => {
                    console.log(err);
                    res.end();
                });
                res.on("finish", () => {
                    destroy(body);
                });
            } else {
                body ? res.end(body as Buffer | string) : res.end();
            }
        });
    };
}
