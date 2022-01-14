import { getType } from "mime";

export function contentType(mediaType: string, charset?: string) {
    return { "Content-Type": `${getType(mediaType)}${charset ? `; charset=${charset.toUpperCase()}` : ""}` };
}

/**
 * Specify a content length by a number
 * 
 * @param length the content-length you want to set. It must be an integer
 */
export function contentLength(length: number): { "Content-Length"?: number; };
/**
 * Using size of given string or Buffer as content length
 * 
 * @param content the content you'd like to response.
 */
export function contentLength(content: string | Buffer): { "Content-Length": number; };
export function contentLength(input: number | string | Buffer): { "Content-Length"?: number; } {
    if (typeof input === "number") {
        const check = Number.isInteger(input);
        if (!check) console.log(`Content-Length should be an integer`);
        return check ? { "Content-Length": input } : {};
    }
    if(typeof input === "string") {
        return {"Content-Length": input.length}
    }
    if(input instanceof Buffer) {
        return {"Content-Length": input.length}
    }
    return {}
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
