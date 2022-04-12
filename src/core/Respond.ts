import { Readable } from "stream";
import { MaybePromise } from "../utils";
import StatusCode from "./Status";

export type Status = StatusCode | [StatusCode, string]
export type HttpHeader = { [headerName: string]: string | string[] }
export type BinaryBody = string | Uint8Array | Readable | null
export type Respond<T> = [Status, T, ...HttpHeader[]]
export type BinaryRespond = [
    Status, BinaryBody,
    ...HttpHeader[]
]

export function binarizeRes<T>(res: Respond<T>, transformer: (value: T) => BinaryBody): BinaryRespond
export function binarizeRes<T>(res: Respond<T>, transformer: (value: T) => Promise<BinaryBody>): Promise<BinaryRespond>
export function binarizeRes<T>(res: Promise<Respond<T>>, transformer: (value: T) => MaybePromise<BinaryBody>): Promise<BinaryRespond>
export function binarizeRes<T>(res: MaybePromise<Respond<T>>, transformer: (value: T) => MaybePromise<BinaryBody>): MaybePromise<BinaryRespond> {
    if (res instanceof Promise) return res.then(async ([status, body, ...headers]) => [status, await transformer(body), ...headers])
    else {
        const [status, body, ...headers] = res;
        const binaryBodyMP = transformer(body);
        if (binaryBodyMP instanceof Promise) return binaryBodyMP.then(body => [status, body, ...headers])
        else return [status, binaryBodyMP, ...headers]
    }
}
