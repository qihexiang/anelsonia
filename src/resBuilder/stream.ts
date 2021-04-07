import { Readable } from "stream";
import { ResponseBody } from "../usr/Basic";
import HttpStatus from "../usr/HTTPCodes";

/**
 * Generate a stream response
 * 
 * @param rStream A Readabel stream
 * @returns A ResponseBody includes a Readable stream.
 */
export function stream(rStream: Readable): ResponseBody {
    return {
        statusCode: 200,
        statusMessage: HttpStatus[200],
        headers: { "Content-Type": "application/octect-stream" },
        data: rStream
    };
}

/**
 * Generate a binary response.
 * 
 * @param buf The buf you want to write to the response.
 * @returns A ResponseBody includes a Buffer-data
 */
export function buffer(buf: Buffer): ResponseBody {
    return {
        statusCode: 200,
        statusMessage: HttpStatus[200],
        headers: { "Content-Type": "application/octect-stream" },
        data: buf
    };
}