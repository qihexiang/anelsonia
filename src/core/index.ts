import destroy from "destroy";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Stream } from "stream";
import { ResponseProps } from "../response";

export type FreesiaRequest = IncomingMessage | Http2ServerRequest;
type FreesiaResponse = ServerResponse | Http2ServerResponse;
type ReqHandler = (req: FreesiaRequest, res: FreesiaResponse) => void;
export type EntryPoint = (req: FreesiaRequest) => ResponseProps | Promise<ResponseProps>;

export function shim(entry: EntryPoint): ReqHandler {
    return async (req, res) => {
        const { statusCode, statusMessage, body, headers } = await entry(req);
        if (res instanceof IncomingMessage) res.writeHead(statusCode, statusMessage, headers);
        res.writeHead(statusCode, headers);
        if (body instanceof Stream) {
            body.pipe(res);
            res.on("finish", () => {
                destroy(body);
            });
        } else {
            body ? res.end(body as Buffer | string) : res.end();
        }
    };
}
