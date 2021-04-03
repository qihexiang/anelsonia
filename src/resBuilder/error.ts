import { ResponseBody } from "../usr/Basic";
import HttpStatus from "../usr/HTTPCodes";

export function httpError(code: number, message?: string): ResponseBody {
    if (!(code in HttpStatus)) code = 500;
    return {
        statusCode: code,
        statusMessage: HttpStatus[code],
        header: {"Content-Type": "text/plain"},
        data: message || `${code} ${HttpStatus[code]}`
    };
}