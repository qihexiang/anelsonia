import { Readable } from "stream";
import { responseBody } from "../usr/Basic";
import httpStatus from "../usr/HTTPCodes";

export function stream(rStream: Readable): responseBody {
    return {
        statusCode: 200,
        statusMessage: httpStatus[200],
        header: { "Content-Type": "application/octect-stream" },
        data: rStream
    };
}

export function buffer(buf: Buffer): responseBody {
    return {
        statusCode: 200,
        statusMessage: httpStatus[200],
        header: { "Content-Type": "application/octect-stream" },
        data: buf
    };
}