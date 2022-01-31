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
 * Create a context for request with a default value.
 * 
 * @param defaultValue The default value of the context
 * @returns [initCtx, useCtx, dropCtx]
 */
export const createCtx = <T>(defaultValue: T): [
    (initValue?: T) => void, () => Readonly<T>, () => void
] => {
    const context = new WeakMap<{}, T>();
    const getSym = () => {
        const sym = reqSyms.getStore();
        if (sym === undefined) throw new Error("Failed to get symbol of this request");
        return sym;
    };
    const isInitized = (sym: {}) => { if (!context.has(sym)) throw new Error("Context not initialized or dropped."); };

    return [
        /**
         * Initialize context for this request.
         * 
         * @param initValue the value you'd like to set, if it's
         * undefined, context will initialized with default value.
         */
        (initValue?: T) => {
            const sym = getSym();
            if (context.has(sym)) throw new Error("Can't initialize a context twice.");
            if (initValue === undefined) context.set(sym, defaultValue);
            else context.set(sym, initValue);
        },
        /**
         * Get context of this request.
         * 
         * @returns context
         */
        () => {
            const sym = getSym();
            isInitized(sym);
            const result = context.get(sym) ?? defaultValue;
            return result;
        },
        /**
         * Drop context of request after using it.
         */ 
        () => {
            const sym = getSym();
            isInitized(sym);
            context.delete(sym);
        }
    ];
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
