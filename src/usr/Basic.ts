import { IncomingMessage } from "http";
import { Readable } from "stream";

export interface responseBody {
    statusCode: number;
    statusMessage: string;
    header: { [name: string]: string; };
    data: string | Buffer | Readable | Object | null;
}

export interface entryPoint {
    (req: IncomingMessage): responseBody | Promise<responseBody>;
}
