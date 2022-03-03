import { ResponseProps } from "./Respond.ts";
import { MaybePromise } from "../utils/MaybePromise.ts";

/**
 * ReqHandler is the type of handler for serve function in http module of Deno standard library
 */
export type ReqHandler = (req: Request) => MaybePromise<Response>;
/**
 * EntryPoint is the type of main function of a Freesia application
 */
export type EntryPoint = (req: Request) => MaybePromise<ResponseProps>;

/**
 * Transform an EntryPoint function to a handler for serve function
 *
 * @param main the main function of your application.
 * @returns a handler for serve function
 */
export function shimHTTP(main: EntryPoint) {
    return async (req: Request) => {
        const { status, statusText, body, headers } = await main(req);
        return new Response(body, {
            status: status,
            statusText: statusText,
            headers,
        });
    };
}
