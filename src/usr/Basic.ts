import { IncomingMessage, OutgoingHttpHeaders } from "http";
import { Readable } from "stream";

export interface ResponseBody {
    statusCode: number;
    statusMessage: string;
    header: OutgoingHttpHeaders;
    data: string | Buffer | Readable;
}

export interface EntryPoint {
    (req: IncomingMessage): Promise<ResponseBody>;
}
