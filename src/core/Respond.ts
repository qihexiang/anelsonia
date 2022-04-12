import { Readable } from "stream";
import { MaybePromise } from "../utils";
import StatusCode from "./Status";

type Status = StatusCode | [StatusCode, string]
type HttpHeader = {[headerName: string]: string | string[]}
type BinaryBody = string | Uint8Array | Readable | null
export type Respond<T> = [T, Status, ...HttpHeader[]]
export type BinaryRespond = [
    BinaryBody,
    Status, ...HttpHeader[]
]

export function binarizeRes<T>(res: Respond<T>, transformer: (value: T) => BinaryBody): BinaryRespond
export function binarizeRes<T>(res: Respond<T>, transformer: (value: T) => Promise<BinaryBody>): Promise<BinaryRespond>
export function binarizeRes<T>(res: Promise<Respond<T>>, transformer: (value: T) => MaybePromise<BinaryBody>): Promise<BinaryRespond>
export function binarizeRes<T>(res: MaybePromise<Respond<T>>, transformer: (value: T)=> MaybePromise<BinaryBody>): MaybePromise<BinaryRespond> {
    if(res instanceof Promise) return res.then(async ([body, status, ...headers]) => [await transformer(body), status, ...headers])
    else {
        const [body, status, ...headers] = res;
        const binaryBodyMP = transformer(body);
        if(binaryBodyMP instanceof Promise) return binaryBodyMP.then(body => [body, status, ...headers])
        else return [binaryBodyMP, status, ...headers]
    }
}
