import { ResponseBody } from "../usr/Basic";
import HttpStatus from "../usr/HTTPCodes";

export function redirection(code: 301 | 302, location: string, message: string): ResponseBody {
    return {
        statusCode: code,
        statusMessage: HttpStatus[code],
        headers: { location },
        data: message
    };
}