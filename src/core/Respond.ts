import { statusMessage, validHttpStatusCode } from "./http";
import MaybePromise from "../utils/MaybePromise";
import Stream from "stream";

export interface ResponseProps {
    statusCode: validHttpStatusCode,
    statusMessage: string,
    body?: ResponseBody,
    headers: HeaderObject;
}

export type ResponseBody = string | Buffer | Stream;

export type AsyncResponse = MaybePromise<ResponseProps>;

export class Respond implements ResponseProps {
    private _statusCode?: validHttpStatusCode = undefined;
    private _statusMessage?: string = undefined;
    private _body?: ResponseBody = undefined;
    private _headers: HeaderObject = {};
    /**
     * Create an empty response, default status code is 404.
     */
    static create(): Respond;
    /**
     * Create an empty response with given status code.
     * 
     * @param code http status code.
     */
    static create(code: validHttpStatusCode): Respond;
    /**
     * Create a response with given body, default status code is 200.
     * 
     * @param body a string, buffer or stream.
     */
    static create(body: ResponseBody): Respond;
    /**
     * Create a response with given status code and body.
     * 
     * @param code http status code.
     * @param body a string, buffer or stream.
     */
    static create(code: validHttpStatusCode, body: ResponseBody): Respond;
    /**
     * Create a response with given status code and headers.
     * 
     * @param code http status code.
     * @param headers http headers like `"Content-Type"`.
     */
    static create(code: validHttpStatusCode, headers: HeaderCollection): Respond;
    /**
     * Create a response with given body and headers, default status code is 200.
     * 
     * @param body a string, buffer or stream.
     * @param headers http headers like `"Content-Type"`.
     */
    static create(body: ResponseBody, headers: HeaderCollection): Respond;
    /**
     * Create a response with given status code, body and http headers.
     * 
     * @param code http status code.
     * @param body a string, buffer or stream.
     * @param headers http headers like `"Content-Type"`.
     */
    static create(code: validHttpStatusCode, body: ResponseBody, headers: HeaderCollection): Respond;
    static create(arg1?: validHttpStatusCode | ResponseBody, arg2?: ResponseBody | HeaderCollection, headers?: HeaderCollection): Respond {
        const response = new Respond();
        if (typeof arg1 === "number") {
            response.setStatusCode(arg1);
            if (typeof arg2 === "string" || arg2 instanceof Buffer || arg2 instanceof Stream) response.setBody(arg2);
            else if (typeof arg2 === "object") response.setHeaders(arg2);
        }
        if (typeof arg1 === "string" || arg1 instanceof Buffer || arg1 instanceof Stream) {
            response.setBody(arg1);
            if (typeof arg2 === "object") response.setHeaders(arg2 as HeaderCollection);
        }
        if (headers) response.setHeaders(headers);
        return response;
    }
    /**
     * Set status code manually
     * 
     * @param code a valid http status code
     * @returns this instance itself
     */
    setStatusCode(code: validHttpStatusCode): Respond {
        this._statusCode = code;
        return this;
    }
    get statusCode(): validHttpStatusCode {
        return this._statusCode ?? (this._body ? 200 : 404);
    }
    /**
     * Set a status message manually.
     * 
     * > Don't forget that this dosen't work in HTTP/2
     * 
     * @param message a status message in string type
     * @returns this instance itself
     */
    setStatusMessage(message: string): Respond {
        this._statusMessage = message;
        return this;
    }
    get statusMessage(): string {
        return this._statusMessage ?? statusMessage[this.statusCode];
    }
    /**
     * Set a response body, it can be a readable stream, a buffer or a string.
     * 
     * If you'd like to response a json, using JSON.stringify to transfrom it.
     * 
     * @param body the body you'd like to response.
     * @returns this instance it self
     */
    setBody(body: ResponseBody): Respond {
        this._body = body;
        return this;
    }
    get body(): ResponseBody | undefined {
        return this._body;
    }
    /**
     * Add a header in key-value mode, for example: `res.setHeader("Keep-Alive": "timeout=5")`
     * 
     * @param headerName the name of the HTTP response header 
     * @param value the value of the http response header
     */
    setHeaders(headerName: string, value: HeaderValue): Respond;
    /**
     * Add one or more headers in array style, like:
     * 
     * ```ts
     * response.setHeaders(
     *     ["Keep-Alive", "timeout=5"],
     *     ["Content-Type", "text/plain; charset=UTF-8"]
     * )
     * ```
     * 
     * @param headers Array-Style http response headers.
     */
    setHeaders(...headers: HeaderArray[]): Respond;
    /**
     * Add one or more headers to the response, like:
     * 
     * ```ts
     * response.setHeaders({"Keep-Alive": "timeout=5"}, {"Content-Type": "text/plain; charset=UTF-8"})
     * // which equals to
     * response.setHeaders({"Keep-Alive": "timeout=5", "Content-Type": "text/plain; charset=UTF-8"})
     * ```
     * 
     * @param headers Object-style http response headers.
     */
    setHeaders(...headers: HeaderObject[]): Respond;
    /**
     * Add one or more headers to the response, you can use both 
     * array-style and object-style headers.
     * 
     * @param headers Array-style or Object-style response headers.
     */
    setHeaders(...headers: HeaderCollection[]): Respond;
    setHeaders(arg1: string | HeaderCollection, arg2?: HeaderValue | HeaderCollection, ...rest: HeaderCollection[]): Respond {
        if (typeof arg1 === "string") {
            this._headers = { ...this._headers, [arg1]: arg2 as HeaderValue };
            return this;
        }
        const headers = ([arg1, arg2 as HeaderCollection, ...rest]).map(h => h instanceof Array ? { [h[0]]: h[1] } : h);
        this._headers = { ...this._headers, ...headers.reduce((pre, cur) => ({ ...pre, ...cur }), {}) };
        return this;
    }
    get headers(): HeaderObject {
        return this._headers;
    }
}

export const createRes = Respond.create;

export type HeaderValue = string | string[] | number;

export type HeaderObject = {
    [propName: string]: HeaderValue;
};

export type HeaderArray = [string, HeaderValue];

export type HeaderCollection = HeaderArray | HeaderObject;

export default createRes;
