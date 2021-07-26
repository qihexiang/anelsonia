import { IncomingMessage } from "http";
import { ServerResponse } from "node:http";
import { Http2ServerRequest, Http2ServerResponse } from "node:http2";
import { Readable } from "stream";
import { ResponseProps } from "../response";

export type FreesiaRequest = IncomingMessage | Http2ServerRequest;
type FreesiaResponse = ServerResponse | Http2ServerResponse;
type ReqHandler = (req: FreesiaRequest, res: FreesiaResponse) => void;
export type EntryPoint = (req: FreesiaRequest) => ResponseProps | Promise<ResponseProps>;

export function shim(entry: EntryPoint): ReqHandler {
    return async (req, res) => {
        const { statusCode, statusMessage, body, headers } = await entry(req);
        res.writeHead(statusCode, statusMessage, headers);
        if (body instanceof Readable) {
            body.pipe(res);
            body.on("error", (err) => { body.unpipe(res) });
            res.on("finish", () => {
                body.destroy();
            });
        } else {
            body ? res.end(body) : res.end();
        }
    };
}
