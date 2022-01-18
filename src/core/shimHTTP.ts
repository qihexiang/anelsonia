import destroy from "destroy";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Stream } from "stream";
import { ResponseProps, AsyncResponse } from "./response";

export type HttpReq = IncomingMessage | Http2ServerRequest;
export type HttpRes = ServerResponse | Http2ServerResponse;
export type ReqHandler = (req: HttpReq, res: HttpRes) => void;
type EntryPoint = (req: HttpReq) => AsyncResponse;

export function shimHTTP(entry: EntryPoint): ReqHandler {
    return async (req, res) => {
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
    };
}
