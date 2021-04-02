import { responseBody } from "../usr/Basic";
import httpStatus from "../usr/HTTPCodes";

export function json(object: Object): responseBody {
    const content = JSON.stringify(object);
    return {
        statusCode: 200,
        statusMessage: httpStatus[200],
        header: { "Content-Type": "application/json" },
        data: content
    };
}