import { createReadStream } from "fs";
import { OutgoingHttpHeaders } from "http";
import { getType } from "mime";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { validHttpStatusCode, httpCodes, clientErrorCode, serverErrorCode } from "../http";

export interface ResponseProps {
    statusCode: validHttpStatusCode,
    statusMessage: string,
    data: string | Buffer | Readable,
    headers: OutgoingHttpHeaders;
}

export class Response implements ResponseProps {
    private _statusCode?: validHttpStatusCode = undefined;
    private _statusMessage?: string = undefined;
    private _data?: string | Buffer | Readable = undefined;
    private _headers: OutgoingHttpHeaders = {};
    setStatusCode(code: validHttpStatusCode): Response {
        this._statusCode = code;
        return this;
    }
    get statusCode(): validHttpStatusCode {
        return this._statusCode ?? (this._data ? 200 : 404);
    }
    setStatusMessage(message: string): | Response {
        this._statusMessage = message;
        return this;
    }
    get statusMessage(): string {
        return this._statusMessage ?? httpCodes[this.statusCode];
    }
    setData(data: string | Buffer | Readable): Response {
        this._data = data;
        return this;
    }
    get data(): string | Buffer | Readable {
        return this._data ?? this.statusMessage;
    }
    setHeaders(headers: Partial<OutgoingHttpHeaders>): Response {
        this._headers = { ...this._headers, ...headers };
        return this;
    }
    get headers(): OutgoingHttpHeaders {
        return { ...this._headers };
    }
}

export default Response;

export function contentType(typeName: string): { "content-type": string; } {
    return {
        "content-type": getType(typeName) ?? "application/octect-stream"
    }
}

export function resHtml(html: string): ResponseProps {
    return new Response().setData(html).setHeaders({ "content-type": "text/html" });
}

export function resJSON(json: Object): ResponseProps {
    try {
        const data = JSON.stringify(json);
        return new Response().setData(data).setHeaders({ "content-type": "application/json" });
    } catch (err) {
        console.log(err);
        return new Response().setStatusCode(500);
    }
}

export async function resFile(path: string): Promise<ResponseProps> {
    try {
        const metadata = await stat(path);
        const rStream = createReadStream(path);
        const mimeType = getType(path) ?? "application/octect-stream";
        return new Response().setData(rStream).setHeaders({
            "content-type": mimeType,
            "content-length": metadata.size
        });
    } catch (err) {
        console.log(err);
        return new Response().setStatusCode(404);
    }
}

export function resHttpError(statusCode: clientErrorCode | serverErrorCode, message: string = httpCodes[statusCode]) {
    return new Response().setStatusCode(statusCode).setStatusMessage(message);
}
