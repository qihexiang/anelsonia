import { isVoid } from "../utils/isVoid.ts";

/**
 * ResponseBody is a subset of Deno BodyInit, which includes
 * `string`, `Blob` and `ReadableStream` of `Uint8Array`, and
 * you can use undefined or null for a no-contentn response
 */
export type ResponseBody =
    | string
    | Blob
    | ReadableStream<Uint8Array>
    | null
    | undefined;

/**
 * ResponseProps is the return type of a EntryPoint function, which includes
 * everything that a response need: status code, status meassage, response body
 * and response headers.
 */
export interface ResponseProps {
    status: number;
    statusText?: string;
    body?: ResponseBody;
    headers: Record<string, string>;
}

/**
 * Respond is extended from a readonly ResponseProps, which
 * means that you can't modify the properties of the object.
 * Respond provides 4 methods to create a new Respond object
 * from the old one.
 */
export interface Respond extends Readonly<ResponseProps> {
    /**
     * Generate a new Repond object with a new status code
     *
     * @param code status code, recommended to set is with
     * `Status` enum from http_status.ts in standard library
     */
    setStatus(code: number): Respond;
    /**
     * Generate a new Respond object with a new status message.
     *
     * @param text status message, this may not work with HTTP/2
     * and some clients.
     */
    setStatusText(text: string): Respond;
    /**
     * Generate a new Respond object with a new response body.
     *
     * @param body response body, if your status is 204, just
     * left it undefined.
     */
    setBody(body: ResponseBody): Respond;
    /**
     * Generate a new Respond object with a new response header,
     * by given header name an the value.
     *
     * @param headerName the header name.
     * @param headerValue the value of header.
     */
    setHeaders(headerName: string, headerValue: string): Respond;
    /**
     * Generate a new Respond object with one or more response
     * headers.
     *
     * @param headers headers in array or object format, like:
     *
     * ```ts
     * const res = createRes()
     *     .setStatus(200)
     *     .setBody("hello, world")
     *     // in array format
     *     .setHeaders(["Content-Type", "text/plain; charset=UTF-8"], ["Content-Length", "12"])
     *     // in object format
     *     .setHeaders({
     *         "Connection": "keep-alive", "Keep-Alive": "timeout=5"
     *     })
     *     // mixed style is also ok
     *     .setHeaders({"Server": "Freesia"}, ["Date", new Date().toLocaleString()])
     * ```
     */
    setHeaders(...headers: Headers[]): Respond;
}

/**
 * Define a header in an tuple [key, value].
 */
type ArrayHeaders = [string, string];
/**
 * Define headers in an object.
 */
type RecordHeaders = Record<string, string>;
/**
 * Union type of ArrayHeaders and RecordHeaders.
 */
type Headers = ArrayHeaders | RecordHeaders;

/**
 * Create an empty Respond with status code 404.
 */
export function createRes(): Respond;
/**
 * Create an empty Respond with give status code.
 *
 * @param code
 */
export function createRes(code: number): Respond;
/**
 * Create a Respond with a body, default status code is 200.
 *
 * @param body the response body
 */
export function createRes(body: ResponseBody): Respond;
/**
 * Create a Respond and set both code and body
 *
 * @param code the status code
 * @param body the response body
 */
export function createRes(code: number, body: ResponseBody): Respond;
/**
 * Create a Respond and set both code and headers, and left body empty
 *
 * @param code the status code
 * @param headers a header in array or object format
 */
export function createRes(code: number, headers: Headers): Respond;
export function createRes(body: ResponseBody, headers: Headers): Respond;
/**
 * Create a Respond with given status code, response body and response headers.
 *
 * @param code the status code
 * @param body the response body
 * @param headers a header in array or object format
 */
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
    const { status = 404, statusText, body, headers = {} } = response;
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
            typeof value2 === "string" ||
            value2 instanceof ReadableStream ||
            value2 instanceof Blob ||
            isVoid(value2)
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
