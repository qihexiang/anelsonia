import { IncomingMessage } from "http";
import { Readable } from "stream";

export interface ResponseBody {
    statusCode: number;
    statusMessage: string;
    header: { [name: string]: string; };
    data: string | Buffer | Readable;
}

export interface EntryPoint {
    (req: IncomingMessage): ResponseBody | Promise<ResponseBody>;
}
