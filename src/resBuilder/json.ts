import { ResponseBody } from "../usr/Basic";
import HttpStatus from "../usr/HTTPCodes";

export function json(object: Object): ResponseBody {
    const content = JSON.stringify(object);
    return {
        statusCode: 200,
        statusMessage: HttpStatus[200],
        header: { "Content-Type": "application/json" },
        data: content
    };
}