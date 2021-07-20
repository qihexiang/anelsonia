import { RequestListener, IncomingMessage } from "http";
import { Readable } from "stream";
import { ResponseProps } from "../response";

export type FreesiaEntryPoint = (req: IncomingMessage) => Promise<ResponseProps> | ResponseProps;

export function shim(handler: FreesiaEntryPoint): RequestListener {
    return async (req, res) => {
        const { statusCode, statusMessage, data, headers } = await handler(req);
        res.writeHead(statusCode, statusMessage, headers);
        if (data instanceof Readable) {
            data.pipe(res);
            data.on("error", (err) => {})
            res.on("finish", () => {
                data.destroy()
            })
        } else {
            res.write(data);
            res.end();
        }
    };
}
