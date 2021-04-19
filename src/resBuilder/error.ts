import { ResponseBody } from "../usr/Basic";
import HttpStatus, { validHttpStatusCode } from "../usr/HTTPCodes";

/**
 * Generate a HTTP error response.
 * 
 * @param code HTTP Status code, like `404`, `500`.
 * @param message The message you want to send.
 * @returns A ResponseBody.
 */
export function httpError(code: validHttpStatusCode, message?: string): ResponseBody {
    if (!(code in HttpStatus)) code = 500;
    return {
        statusCode: code,
        statusMessage: HttpStatus[code],
        headers: {"Content-Type": "text/plain"},
        data: message || `${code} ${HttpStatus[code]}`
    };
}