import { RequestListener, IncomingMessage } from "http";
import { Readable } from "stream";
import { ResponseProps } from "../response";

export type FreesiaEntryPoint = (req: IncomingMessage) => Promise<ResponseProps> | ResponseProps;

export function shim(handler: FreesiaEntryPoint): RequestListener {
    return async (req, res) => {
        const { statusCode, statusMessage, body, headers } = await handler(req);
        res.writeHead(statusCode, statusMessage, headers);
        if (body instanceof Readable) {
            body.pipe(res);
            body.on("error", (err) => {})
            res.on("finish", () => {
                body.destroy()
            })
        } else {
            res.write(body);
            res.end();
        }
    };
}
