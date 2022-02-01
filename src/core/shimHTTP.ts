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
interface CreateFlare {
    <T>(): [(value: T) => void, () => Readonly<T>, () => void]
    <T>(options: {mutable: true, reassign: boolean}): [(value: T) => void, () => T, () => void]
    <T>(options: {mutable: false, reassign: boolean}): [(value: T) => Readonly<void>, () => T, () => void]
}

export const createFlare: CreateFlare = <T>(options = {
    mutable: false, reassign: false
}) => {
    const { reassign } = options;
    const getSym = () => {
        const result = reqSyms.getStore();
        if (result === undefined) throw new Error("Can't get symbol of this request.");
        return result;
    };
    const values = new WeakMap<{}, T>();
    const light = (value: T) => {
        const sym = getSym();
        if (!reassign && values.has(sym)) throw new Error("Value of this request is already on bridge.");
        values.set(sym, value);
    };
    const observe = () => {
        const value = values.get(getSym());
        if (value === undefined) throw new Error("No value of this request is on bridge.");
        return value;
    };
    const extinguish = () => {
        if (!values.delete(getSym())) throw new Error("No value of this request is on bridge.");
    };
    return [light, observe, extinguish];
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
