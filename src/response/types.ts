import { OutgoingHttpHeaders } from "http";
import { validHttpStatusCode } from "../utils";

export interface ResponseProps {
    statusCode: validHttpStatusCode,
    statusMessage: string,
    body?: ResponseBody,
    headers: OutgoingHttpHeaders;
}

export type ResponseBody = string | Buffer | ReadableStream;

export type AsyncResponse = ResponseProps | Promise<ResponseProps>;