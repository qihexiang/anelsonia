import { responseBody } from "../usr/Basic";
import httpStatus from "../usr/HTTPCodes";

export function httpError(code: number, message?: string): responseBody {
    if (!(code in httpStatus)) code = 500;
    return {
        statusCode: code,
        statusMessage: httpStatus[code],
        header: {"Content-Type": "text/plain"},
        data: message || `${code} ${httpStatus[code]}`
    };
}