import { isVoid } from "../utils/isVoid.ts";

/**
 * ResponseProps is the return type of a EntryPoint function, which includes
 * everything that a response need: status code, status meassage, response body
 * and response headers.
 */
export interface ResponseProps {
    status: number;
    statusText?: string;
    body?: BodyInit;
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
    setBody(body: BodyInit): Respond;
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
export function createRes(body: BodyInit): Respond;
/**
 * Create a Respond and set both code and body
 *
 * @param code the status code
 * @param body the response body
 */
export function createRes(code: number, body: BodyInit): Respond;
/**
 * Create a Respond and set both code and headers, and left body empty
 *
 * @param code the status code
 * @param headers a header in array or object format
 */
export function createRes(code: number, headers: Headers): Respond;
export function createRes(body: BodyInit, headers: Headers): Respond;
/**
 * Create a Respond with given status code, response body and response headers.
 *
 * @param code the status code
 * @param body the response body
 * @param headers a header in array or object format
 */
export function createRes(
    code: number,
    body: BodyInit,
    headers: Headers,
): Respond;
export function createRes(
    arg1?: number | BodyInit,
    arg2?: BodyInit | Headers,
    arg3?: Headers,
): Respond {
    if (isVoid(arg1)) return createFullRes({});
    else if (isVoid(arg2)) return createResWithOneValue(arg1);
    else if (isVoid(arg3)) return createResWithTwoValue(arg1, arg2);
    else {
        return createFullRes({
            status: arg1 as number,
            body: arg2 as BodyInit,
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

function createResWithOneValue(value: number | BodyInit): Respond {
    if (typeof value === "number") return createFullRes({ status: value });
    else return createFullRes({ status: 200, body: value });
}

function createResWithTwoValue(
    value1: number | BodyInit,
    value2: BodyInit | Headers,
) {
    if (typeof value1 === "number") {
        if (isBodyInit(value2)) {
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

function isArrayBufferView(
    content: unknown,
): content is ArrayBufferView {
    return [
        Int8Array,
        Uint8Array,
        Uint8ClampedArray,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
        BigInt64Array,
        BigUint64Array,
        DataView,
    ].reduce(
        (result, nextType) => result || (content instanceof nextType),
        false as boolean,
    );
}

function isBodyInit(content: unknown): content is BodyInit {
    return typeof content === "string" ||
        content instanceof Blob ||
        content instanceof ReadableStream ||
        content instanceof ArrayBuffer ||
        isArrayBufferView(content) ||
        content instanceof FormData ||
        content instanceof URLSearchParams;
}

const defaultTransformer = (value: unknown): BodyInit => {
    if (isBodyInit(value)) return value;
    else if (
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "bigint" ||
        typeof value === "symbol"
    ) {
        return String(value);
    } else return JSON.stringify(value);
};
const asyncDefaultTransformer = async (body: unknown): Promise<BodyInit> => {
    const value = await body;
    return defaultTransformer(value);
};
export type StatusElement = number | [number, string];
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
export type TypedResponse<T> = [StatusElement] | [StatusElement, T | null] | [
    StatusElement,
    T | null,
    ...Headers[],
];

/**
 * Create a Respond from a TypedResponse
 *
 * @param tuple The TypedResponse tuple
 * @param transformer transformer to convert body to a BodyInit
 * @returns a Respond
 */
export function ResFromTuple<T>(
    tuple: TypedResponse<T>,
    transformer: (value?: T | null) => BodyInit = defaultTransformer,
): Respond {
    const [statusElement, body, ...headers] = tuple;
    const [status, statusText] = statusElement instanceof Array
        ? statusElement
        : [statusElement];
    const response = createRes(status, transformer(body)).setHeaders(
        ...headers,
    );
    if (isVoid(statusText)) return response;
    else return response.setStatusText(statusText);
}

/**
 * Create a Respond from a TypedResponse
 *
 * @param tuple The TypedResponse tuple
 * @param transformer transformer to convert body to a Promised BodyInit
 * @returns a Promised Respond
 */
export async function asyncResFromTuple<T>(
    tuple: TypedResponse<T>,
    transformer: (value?: T | null) => Promise<BodyInit> =
        asyncDefaultTransformer,
): Promise<Respond> {
    const [statusElement, body, ...headers] = tuple;
    const [status, statusText] = statusElement instanceof Array
        ? statusElement
        : [statusElement];
    const response = createRes(status, await transformer(body)).setHeaders(
        ...headers,
    );
    if (isVoid(statusText)) return response;
    else return response.setStatusText(statusText);
}
