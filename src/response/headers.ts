import { getType } from "mime";

export const contentType = (typename: string) => ({ "Content-Type": getType(typename) ?? "application/octect-stream" });
export const contentLength = (length: number) => {
    if (Number.isInteger(length)) return { "Content-Length": length };
    return {};
};
