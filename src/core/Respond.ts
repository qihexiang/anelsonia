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

function isResponseBody(value: unknown): value is ResponseBody {
    return (
        typeof value === "string" ||
        value instanceof Buffer ||
        value instanceof Readable ||
        isVoid(value)
    );
}

export default createRes;

export type StatusElement = Status | [Status, string];
/**
 * Define a response with type by a tuple.
 * 
 * The first element can define the status code and the status message, like: `200`, `[200, "Ok"]`
 * 
 * The scecond element is the response body, if you'd like to give a empty body, left it empty or set it to `null`.
 * 
 * Elements after the third is headers.
 * 
 * Use ResFromTuple to transform it to a Respond.
 * 
 * examples:
 * 
 * ```ts
 * const response: TypedRespond<bigint> = [200]
 * const response: TypedRespond<bigint> = [[200, "Ok"]]
 * const response: TypedRespond<bigint> = [[200, "Ok"], 0n]
 * const response: TypedRespond<bigint> = [[200, "Ok"], 0n, ["Content-Type": "text/plain; charset=UTF-8"]]
 * const response: TypedRespond<bigint> = [200, 0n, ["Content-Type": "text/plain; charset=UTF-8"]]
 * const response: TypedRespond<bigint> = [500, null, ["Content-Type": "text/plain; charset=UTF-8"]]
 * ```
 */
export type TypedResponse<T> = [StatusElement] | [StatusElement, T | null] | [StatusElement, T | null, ...Headers[]];

/**
 * Create a Respond from a TypedResponse
 * 
 * @param tuple The TypedResponse tuple
 * @param transformer transformer to convert body to a ResponseBody
 * @returns a Respond
 */
export function ResFromTuple<T>(tuple: TypedResponse<T>, transformer: (value?: T | null) => ResponseBody): Respond {
    const [statusElement, body, ...headers] = tuple;
    const [status, statusText] = statusElement instanceof Array ? statusElement : [statusElement];
    const response = createRes(status, transformer(body)).setHeaders(...headers);
    if (isVoid(statusText)) return response;
    else return response.setStatusText(statusText);
}
