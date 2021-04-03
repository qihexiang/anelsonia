import { Readable } from "stream";
import { ResponseBody } from "../usr/Basic";
import HttpStatus from "../usr/HTTPCodes";

export function stream(rStream: Readable): ResponseBody {
    return {
        statusCode: 200,
        statusMessage: HttpStatus[200],
        header: { "Content-Type": "application/octect-stream" },
        data: rStream
    };
}

export function buffer(buf: Buffer): ResponseBody {
    return {
        statusCode: 200,
        statusMessage: HttpStatus[200],
        header: { "Content-Type": "application/octect-stream" },
        data: buf
    };
}