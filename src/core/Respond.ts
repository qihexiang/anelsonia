import { isVoid } from "../utils/isVoid.ts";

export type ResponseBody = string | Blob | ReadableStream<Uint8Array>;

export interface ResponseProps {
    readonly status: number;
    readonly statusText?: string;
    readonly body?: ResponseBody;
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

export function createRes(): Respond;
export function createRes(code: number): Respond;
export function createRes(body: ResponseBody): Respond;
export function createRes(code: number, body: ResponseBody): Respond;
export function createRes(code: number, headers: Headers): Respond;
export function createRes(body: ResponseBody, headers: Headers): Respond;
export function createRes(
    code: number,
    body: ResponseBody,
    headers: Headers,
): Respond;
export function createRes(
    arg1?: number | ResponseBody,
    arg2?: ResponseBody | Headers,
    arg3?: Headers,
): Respond {
    if (isVoid(arg1)) return createFullRes({});
    else if (isVoid(arg2)) return createResWithOneValue(arg1);
    else if (isVoid(arg3)) return createResWithTwoValue(arg1, arg2);
    else {
        return createFullRes({
            status: arg1 as number,
            body: arg2 as ResponseBody,
            headers: formatToRecord(arg3),
        });
    }
}

function createFullRes(response: Partial<ResponseProps>): Respond {
    const { status = 404, statusText, body, headers = {} } =
        response;
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
            if (
                typeof arg1 === "string" && typeof arg2 === "string"
            ) {
                headersToAppend.push({ [arg1]: arg2 });
            } else {
                headersToAppend = [arg1 as Headers, arg2 as Headers, ...rest]
                    .map(
                        formatToRecord,
                    );
            }
            const updatedHeaders = headersToAppend.reduce(
                (currentHeaders, nextHeader) => {
                    return { ...currentHeaders, ...nextHeader };
                },
                headers,
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

function createResWithOneValue(value: number | ResponseBody): Respond {
    if (typeof value === "number") return createFullRes({ status: value });
    else return createFullRes({ status: 200, body: value });
}

function createResWithTwoValue(
    value1: number | ResponseBody,
    value2: ResponseBody | Headers,
) {
    if (typeof value1 === "number") {
        if (
            typeof value2 === "string" || value2 instanceof ReadableStream ||
            value2 instanceof Blob
        ) {
            return createFullRes({ status: value1, body: value2 });
        } else {
            return createFullRes({
                status: value1,
                headers: formatToRecord(value2),
            });
        }
    } else {
        return createFullRes({
            status: 200,
            body: value1,
            headers: formatToRecord(value2 as Headers),
        });
    }
}
