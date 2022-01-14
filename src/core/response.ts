import { OutgoingHttpHeaders } from "http";
import { statusMessage, validHttpStatusCode } from "./http";
import Stream from "stream";

export interface ResponseProps {
    statusCode: validHttpStatusCode,
    statusMessage: string,
    body?: ResponseBody,
    headers: OutgoingHttpHeaders;
}

export type ResponseBody = string | Buffer | Stream;

export type AsyncResponse = ResponseProps | Promise<ResponseProps>;

export class Respond implements ResponseProps {
    private _statusCode?: validHttpStatusCode = undefined;
    private _statusMessage?: string = undefined;
    private _body?: ResponseBody = undefined;
    private _headers: OutgoingHttpHeaders = {};
    /**
     * Create a response with nothing. This will give you a 404 response.
     */
    constructor();
    /**
     * Create a response with given response body, default status code would be 200.
     * 
     * @param body a string, buffer or a readable stream you'd like to respond.
     */
    constructor(body: ResponseBody);
    /**
     * Create a response with given response body and specify a http status code
     * 
     * @param statusCode the http status code you want.
     * @param body a string, buffer or a readable stream you'd like to respond.
     */
    constructor(statusCode: validHttpStatusCode, body: ResponseBody);
    /**
     * Create a response with given response body, specify a http status code and 
     * set http headers.
     * 
     * @param statusCode the http status code you want.
     * @param body a string, buffer or a readable stream you'd like to respond.
     * @param headers the http headers you'd like to set.
     */
    constructor(statusCode: validHttpStatusCode, body: ResponseBody, ...headers: Partial<OutgoingHttpHeaders>[]);
    constructor(bodyOrCode?: ResponseBody | validHttpStatusCode, body?: ResponseBody, ...headers: Partial<OutgoingHttpHeaders>[]) {
        if (body !== undefined) {
            this._statusCode = bodyOrCode as validHttpStatusCode;
            this._body = body;
            if (headers) this._headers = headers.reduce((headers, nextHeaders) => ({ ...headers, ...nextHeaders }), this._headers);
        } else if (bodyOrCode !== undefined) {
            this._body = bodyOrCode as ResponseBody;
        }
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
     * Set headers of response. You can call this method many times, and it will
     * merge them all.
     * 
     * For example:
     * 
     * ```js
     * res.setHeaders({"Content-Type": "application/json"}).setHeaders({"Access-Control-Allow-Origin": "*"})
     * 
     * res.setHeaders({"Content-Type": "application/json"}, {"Access-Control-Allow-Origin": "*"})
     * 
     * res.setHeaders({"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"})
     * ```
     * 
     * are all equal. Properties later to be received would cover the earlier one with the same key.
     * 
     * @param headers HTTP headers.
     * @returns this instance it self.
     */
    setHeaders(...headers: Partial<OutgoingHttpHeaders>[]): Respond {
        this._headers = { ...this._headers, ...headers.reduce((pre, cur) => ({ ...pre, ...cur }), {}) };
        return this;
    }
    get headers(): OutgoingHttpHeaders {
        return { ...this._headers };
    }
}
