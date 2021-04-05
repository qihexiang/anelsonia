import { IncomingMessage } from "http";
import { OutgoingHttpHeaders } from "node:http";
import { Readable } from "stream";

export interface ResponseBody {
    statusCode: number;
    statusMessage: string;
    header: OutgoingHttpHeaders;
    data: string | Buffer | Readable;
}

export interface EntryPoint {
    (req: IncomingMessage): ResponseBody | Promise<ResponseBody>;
}
