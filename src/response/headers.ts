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

export type EncodingType = "gzip" | "compress" | "deflate" | "identity" | "br";
export function contentEncoding(encodingType: EncodingType) {
    return { "Content-Encoding": encodingType };
}

export function contentLanguage(lang: string, variant?: string) {
    return { "Content-Language": `${lang.toLowerCase()}${variant ? `-${variant.toUpperCase()}` : ""}` };
}

export function serverHeader(product: string = "anelsonia2") { return { "Server": product }; }

export function location(url: string) { return { "Location": url }; }

export function acceptRanges(range: string) { return { "Accept-Ranges": range }; }
