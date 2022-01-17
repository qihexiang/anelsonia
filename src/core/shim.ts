import destroy from "destroy";
import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Stream } from "stream";
import { ResponseProps } from "./response";

export type AnelsoniaReq = IncomingMessage | Http2ServerRequest;
export type AnelsoniaRes = ServerResponse | Http2ServerResponse;
export type ReqHandler = (req: AnelsoniaReq, res: AnelsoniaRes) => void;
export type EntryPoint = (req: AnelsoniaReq) => ResponseProps | Promise<ResponseProps>;

export function shim(entry: EntryPoint): ReqHandler {
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
