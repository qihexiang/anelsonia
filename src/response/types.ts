import { OutgoingHttpHeaders } from "http";
import { Readable } from "stream";
import { validHttpStatusCode } from "../utils";

export interface ResponseProps {
    statusCode: validHttpStatusCode,
    statusMessage: string,
    body: string | Buffer | Readable,
    headers: OutgoingHttpHeaders;
}

export type ResponseBody = string | Buffer | Readable;