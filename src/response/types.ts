import { OutgoingHttpHeaders } from "http";
import Stream from "stream";
import { validHttpStatusCode } from "../utils";

export interface ResponseProps {
    statusCode: validHttpStatusCode,
    statusMessage: string,
    body?: ResponseBody,
    headers: OutgoingHttpHeaders;
}

export type ResponseBody = string | Buffer | Stream;

export type AsyncResponse = ResponseProps | Promise<ResponseProps>;