import { RequestListener, Server, createServer as createHttpServer } from "http";
import { Readable } from "stream";
import { EntryPoint } from "../usr/Basic";
import { handleErr } from "../utils/handleError";

/**
 * Build a HTTP RequestListner using given EntryPoint function.
 * 
 * @param entryHandler The entry function that you write.
 * @returns A RequestListener of http module.
 */
export const genBaseHandler = (entryHandler: EntryPoint): RequestListener => {
    return async (req, res) => {
        const { statusCode, statusMessage, header, data } = await entryHandler(req);
        res.writeHead(statusCode, statusMessage, header);
        if (data instanceof Readable) {
            data.on("data", chunk => res.write(chunk));
            data.on("close", () => res.end());
            res.on("error", err => {
                handleErr(err);
                data.destroy();
            });
        } else {
            res.write(data);
            res.end();
        }
    };
};

/**
 * Build a http server directly using given EntryPoint function.
 * 
 * @param entryHandler The entry function that you write.
 * @returns A Server of http module.
 */
export const createServer = (entryHandler: EntryPoint): Server => {
    return createHttpServer(genBaseHandler(entryHandler));
};