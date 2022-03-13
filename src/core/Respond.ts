import { Readable } from "stream";
import { Status } from "./Status.js";
import { isVoid } from "../utils/isVoid.js";

export type ResponseBody = string | Buffer | Readable | undefined | null;

export interface ResponseProps {
    readonly status: number;
    readonly statusText?: string;
    readonly body: ResponseBody;
    readonly headers: Record<string, string>;
}

export interface Respond extends ResponseProps {
    setStatus(code: number): Respond;
    setStatusText(text: string): Respond;
    setBody(body: ResponseBody): Respond;
    setHeaders(headerName: string, headerValue: string): Respond;
    setHeaders(...headers: Headers[]): Respond;
}

type ArrayHeaders = [string, string];
type RecordHeaders = Record<string, string>;
type Headers = ArrayHeaders | RecordHeaders;

/**
 * create a Respond without body and status code, default status code is 404
 */
export function createRes(): Respond;
/**
 * create a Respond with a status code
 *
 * @param code the status code
 */
export function createRes(code: number): Respond;
/**
 * create a Respond with given body, default status code is 200
 *
 * @param body can be a string, Buffer or Readable stream
 */
export function createRes(body: ResponseBody): Respond;
/**
 * create a Respond with status code and body
 *
 * @param code the status code
 * @param body can be a string, Buffer or Readable stream
 */
export function createRes(code: number, body: ResponseBody): Respond;
/**
 * create a Respond with a status code and set headers
 *
 * @param code the status code
 * @param headers like `{"Content-Type": "application/json"}` or `["Content-Type", "application/json"]`
 */
export function createRes(code: number, headers: Headers): Respond;
/**
 * Create a Respond with body and headers, default code is 200
 *
 * @param body can be a string, Buffer or a Readale stream
 * @param headers like `{"Content-Type": "application/json"}` or `["Content-Type", "application/json"]`
 */
export function createRes(body: ResponseBody, headers: Headers): Respond;
/**
 * Create a Respond with status code, body and headers
 *
 * @param code the status code
 * @param body can be a string, Buffer or a Readale stream
 * @param headers like `{"Content-Type": "application/json"}` or `["Content-Type", "application/json"]`
 */
export function createRes(
    code: number,
    body: ResponseBody,
    headers: Headers
): Respond;
export function createRes(
    arg1?: number | ResponseBody,
    arg2?: ResponseBody | Headers,
    arg3?: Headers
): Respond {
    if (isVoid(arg1)) return createFullRes({});
    else if (isVoid(arg2)) return createResWithOneValue(arg1);
    else if (isVoid(arg3)) return createResWithTwoValue(arg1, arg2);
    else
        return createFullRes({
            status: arg1 as number,
            body: arg2 as ResponseBody,
            headers: formatToRecord(arg3),
        });
}

function createFullRes(response: Partial<ResponseProps>): Respond {
    const {
        status = Status.NotFound,
        statusText,
        body,
        headers = {},
    } = response;
    return {
        status,
        statusText,
        body,
        headers,
        setStatus(code) {
            return createFullRes({ ...response, status: code });
        },
        setStatusText(text: string) {
            return createFullRes({ ...response, statusText: text });
        },
        setBody(body) {
            return createFullRes({ ...response, body });
        },
        setHeaders(
            arg1: string | Headers,
            arg2?: string | Headers,
            ...rest: Headers[]
        ) {
            let headersToAppend: RecordHeaders[] = [];
            if (typeof arg1 === "string" && typeof arg2 === "string")
                headersToAppend.push({ [arg1]: arg2 });
            else {
                headersToAppend = [
                    arg1 as Headers,
                    arg2 as Headers,
                    ...rest,
                ].map(formatToRecord);
            }
            const updatedHeaders = headersToAppend.reduce(
                (currentHeaders, nextHeader) => {
                    return { ...currentHeaders, ...nextHeader };
                },
                headers
            );
            return createFullRes({ ...response, headers: updatedHeaders });
        },
    };
}

const formatToRecord = (header: Headers): RecordHeaders => {
    if (header instanceof Array) {
        const [key, value] = header;
        return { [key]: value };
    }
    return header;
};

function createResWithOneValue(value: Status | ResponseBody): Respond {
    if (typeof value === "number") return createFullRes({ status: value });
    else return createFullRes({ status: Status.Ok, body: value });
}

function createResWithTwoValue(
    value1: Status | ResponseBody,
    value2: ResponseBody | Headers
) {
    if (typeof value1 === "number") {
        if (isResponseBody(value2)) {
            return createFullRes({ status: value1, body: value2 });
        } else {
            return createFullRes({
                status: value1,
                headers: formatToRecord(value2),
            });
        }
    }
    return createFullRes({
        status: Status.Ok,
        body: value1,
        headers: formatToRecord(value2 as Headers),
    });
}

function isResponseBody(value: Headers | ResponseBody): value is ResponseBody {
    return (
        typeof value === "string" ||
        value instanceof Buffer ||
        value instanceof Readable
    );
}

export default createRes;

export type Builder<T> = (transformer: (value: T) => ResponseBody) => Respond;
export type ResponseType<T> = { build: Builder<T>; };
export type ResponseSBH<T> = {
    statusText(message: string): ResponseType<T>;
    build: Builder<T>;
};
export type ResponseSB<T> = {
    headers(...headers: Headers[]): ResponseSBH<T>,
    build: Builder<T>;
};
export type ResponseB<T> = {
    status(code?: Status): ResponseSB<T>;
    build: Builder<T>;
};
export type PreResponse<T> = ResponseB<T> | ResponseSB<T> | ResponseSBH<T> | ResponseType<T>;

export function response<T>(value: T): ResponseB<T> {
    return {
        status(code: Status = 200): ResponseSB<T> {
            return {
                headers(...headers: Headers[]): ResponseSBH<T> {
                    return {
                        statusText(message: string): ResponseType<T> {
                            return {
                                build(transformer: (value: T) => ResponseBody): Respond {
                                    return createRes().setStatus(code).setBody(transformer(value)).setHeaders(...headers).setStatusText(message);
                                }
                            };
                        },
                        build(transformer: (value: T) => ResponseBody) {
                            return createRes().setStatus(code).setBody(transformer(value)).setHeaders(...headers);
                        }
                    };
                },
                build(transformer: (value: T) => ResponseBody) {
                    return createRes().setStatus(code).setBody(transformer(value));
                }
            };
        },
        build(transformer: (value: T) => ResponseBody) {
            return createRes().setBody(transformer(value));
        }
    };
}
