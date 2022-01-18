import { Context } from "koa";
import { AsyncResponse, Respond } from "./response";

type KoaEntryPoint = (ctx: Context) => AsyncResponse;

export function shimKoa(entry: KoaEntryPoint): (ctx: Context) => void {
    return async ctx => {
        const response = await entry(ctx);
        const { statusCode, statusMessage, body, headers } = response;
        ctx.status = statusCode;
        ctx.message = statusMessage;
        for (const headerName in headers) {
            if (typeof headers[headerName] === "number") ctx.set(headerName, String(headers[headerName]));
            else ctx.set(headerName, headers[headerName] as string | string[]);
        }
        ctx.body = body;
    };
}