import { getType } from "mime";

export function contentType(mediaType: string, charset?: string) {
    return { "Content-Type": `${getType(mediaType)}${charset ? `; charset=${charset.toUpperCase()}` : ""}` };
}

export function contentLength(length: number) {
    const check = Number.isInteger(length);
    if (!check) console.log(`Content-Length should be an integer`);
    return check ? { "Content-Length": length } : {};
}

export function contentDisposition(download: false): { "Content-Disposition": string; };
export function contentDisposition(download: true, filename?: string): { "Content-Disposition": string; };
export function contentDisposition(download: boolean, filename?: string) {
    return { "Content-Disposition": `${download ? "attachment" : "inline"}${filename ? `; filename=${filename}` : ""}` };
}

type EncodingType = "gzip" | "compress" | "deflate" | "identity" | "br";
export function contentEncoding(encodingType: EncodingType) {
    return { "Content-Encoding": encodingType };
}

export function contentLanguage(lang: string, variant?: string) {
    return { "Content-Language": `${lang.toLowerCase()}${variant ? `-${variant.toUpperCase()}` : ""}` };
}

export function serverHeader(product: string = "anelsonia2") {
    return { "Server": product };
}

export const location = (url: string) => ({ "Location": url });

export const acceptRanges = (range: string) => ({"Accept-Ranges": range})
