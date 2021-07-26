import { RequestListener, IncomingMessage } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { Readable } from "stream";
import { Response, ResponseProps } from "../response";

export type EntryPoint = (req: IncomingMessage) => Promise<ResponseProps> | ResponseProps;

export function shim(handler: EntryPoint): RequestListener {
    return async (req, res) => {
        const { statusCode, statusMessage, body, headers } = await handler(req);
        res.writeHead(statusCode, statusMessage, headers);
        if (body instanceof Readable) {
            body.pipe(res);
            body.on("error", (err) => { });
            res.on("finish", () => {
                body.destroy();
            });
        } else {
            res.write(body);
            res.end();
        }
    };
}

export type Http2ResponseProps = Omit<ResponseProps, "statusMessage">

export type Http2EntryPoint = (req: Http2ServerRequest) => Promise<Http2ResponseProps> | Http2ResponseProps;

export function http2Shim(handler: Http2EntryPoint) {
    return async (req: Http2ServerRequest, res: Http2ServerResponse) => {
        const { statusCode, body, headers } = await handler(req);
        res.writeHead(statusCode, headers);
        if (body instanceof Readable) {
            body.pipe(res);
            body.on("error", (err) => { });
            res.on("finish", () => {
                body.destroy();
            });
        } else {
            res.write(body);
            res.end();
        }
    };
}
