import { Readable } from "stream";
import { isVoid } from "../utils/isVoid";
import Status from "./Status";

export type ResponseBody = string | Buffer | Readable;

export interface ResponseProps {
    readonly status: Status;
    readonly statusText?: string;
    readonly body?: ResponseBody;
    readonly headers: Record<string, string>;
}

export interface Respond extends ResponseProps {
    setStatus(code: Status): Respond;
    setStatusText(text: string): Respond;
    setBody(body: ResponseBody): Respond;
    setHeaders(headerName: string, headerValue: string): Respond;
    setHeaders(...headers: Headers[]): Respond;
}

type ArrayHeaders = [string, string];
type RecordHeaders = Record<string, string>;
type Headers = ArrayHeaders | RecordHeaders;

export function createRes(): Respond;
export function createRes(code: Status): Respond;
export function createRes(body: ResponseBody): Respond;
export function createRes(code: Status, body: ResponseBody): Respond;
export function createRes(code: Status, headers: Headers): Respond;
export function createRes(body: ResponseBody, headers: Headers): Respond;
export function createRes(
    code: Status,
    body: ResponseBody,
    headers: Headers
): Respond;
export function createRes(
    arg1?: Status | ResponseBody,
    arg2?: ResponseBody | Headers,
    arg3?: Headers
): Respond {
    if (isVoid(arg1)) return createFullRes({});
    else if (isVoid(arg2)) return createResWithOneValue(arg1);
    else if (isVoid(arg3)) return createResWithTwoValue(arg1, arg2);
    else
        return createFullRes({
            status: arg1 as Status,
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
            return createFullRes({ status: value1, headers: formatToRecord(value2) });
        }
    }
    return createFullRes({ status: Status.Ok, body: value1, headers: formatToRecord(value2 as Headers) });
}

function isResponseBody(value: Headers | ResponseBody): value is ResponseBody {
    return typeof value === "string" || value instanceof Buffer || value instanceof Readable;
}

export default createRes;
