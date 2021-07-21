import { OutgoingHttpHeaders } from "http";
import { validHttpStatusCode, statusMessage } from "../utils";
import { ResponseBody, ResponseProps } from "./types";

export class Response implements ResponseProps {
    private _statusCode?: validHttpStatusCode = undefined;
    private _statusMessage?: string = undefined;
    private _body?: ResponseBody = undefined;
    private _headers: OutgoingHttpHeaders = {};
    setStatusCode(code: validHttpStatusCode): Response {
        this._statusCode = code;
        return this;
    }
    get statusCode(): validHttpStatusCode {
        return this._statusCode ?? (this._body ? 200 : 404);
    }
    setStatusMessage(message: string): | Response {
        this._statusMessage = message;
        return this;
    }
    get statusMessage(): string {
        return this._statusMessage ?? statusMessage[this.statusCode];
    }
    setBody(body: ResponseBody): Response {
        this._body = body;
        return this;
    }
    get body(): ResponseBody {
        return this._body ?? this.statusMessage;
    }
    setHeaders(headers: Partial<OutgoingHttpHeaders>): Response {
        this._headers = { ...this._headers, ...headers };
        return this;
    }
    get headers(): OutgoingHttpHeaders {
        return { ...this._headers };
    }
}