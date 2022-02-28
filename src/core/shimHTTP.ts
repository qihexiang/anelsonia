import { ResponseProps } from "./Respond.ts";
import { MaybePromise } from "../utils/MaybePromise.ts";

export type HttpReq = Request;
export type HttpRes = Response;
export type ReqHandler = (req: Request) => MaybePromise<Response>;
export type EntryPoint = (req: HttpReq) => Promise<ResponseProps>;

export const shimHTTP = (main: EntryPoint) => {
    return async (req: Request) => {
        const { status, statusText, body, headers } = await main(req);
        return new Response(body, {
            status: status, statusText: statusText, headers
        });
    };
};
