import { RequestListener, Server, createServer as createHttpServer } from "http";
import { Readable } from "stream";
import { entryPoint } from "../usr/Basic";
import { handleErr } from "../utils/handleError";

export const genBaseHandler = (entryHandler: entryPoint): RequestListener => {
    return async (req, res) => {
        const { statusCode, statusMessage, header, data } = await entryHandler(req)
        res.writeHead(statusCode, statusMessage, header)
        if(data instanceof Readable) {
            data.on("error", err => {
                handleErr(err)
                data.destroy()
            })
            data.on("data", chunk => res.write(chunk))
            data.on("close", () => res.end())
        } else {
            res.end(data)
        }
    };
};

export const createServer = (entryHandler: entryPoint): Server => {
    return createHttpServer(genBaseHandler(entryHandler))
}