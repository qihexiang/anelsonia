import { getType } from "mime";
export type EncodingType = "gzip" | "compress" | "deflate" | "identity" | "br";


export abstract class ResHeader {
    static contentType(mediaType: string, charset?: string) {
        return { "Content-Type": `${getType(mediaType)}${charset ? `; charset=${charset.toUpperCase()}` : ""}` };
    }

    /**
     * Specify a content length by a number
     * 
     * @param length the content-length you want to set. It must be an integer
     */
    static contentLength(length: number): { "Content-Length"?: number; };
    /**
     * Using size of given string or Buffer as content length
     * 
     * @param content the content you'd like to response.
     */
    static contentLength(content: string | Buffer): { "Content-Length": number; };
    static contentLength(input: number | string | Buffer): { "Content-Length"?: number; } {
        if (typeof input === "number") {
            const check = Number.isInteger(input);
            if (!check) console.log(`Content-Length should be an integer`);
            return check ? { "Content-Length": input } : {};
        }
        if (typeof input === "string") {
            return { "Content-Length": input.length };
        }
        if (input instanceof Buffer) {
            return { "Content-Length": input.length };
        }
        return {};
    }

    /**
     * Is this response a download response?
     * 
     * @param download false, this is not a download content
     */
    static contentDisposition(download: false): { "Content-Disposition": string; };
    /**
     * Is this response a download response?
     * 
     * @param download true, this is a download content
     * @param filename the filename of download content
     */
    static contentDisposition(download: true, filename?: string): { "Content-Disposition": string; };
    static contentDisposition(download: boolean, filename?: string) {
        return { "Content-Disposition": `${download ? "attachment" : "inline"}${filename ? `; filename=${filename}` : ""}` };
    }

    static contentEncoding(encodingType: EncodingType): { "Content-Encoding": EncodingType; } {
        return { "Content-Encoding": encodingType };
    }

    static contentLanguage<L extends string>(lang: L): { "Content-Language": `${Lowercase<L>}`; };
    static contentLanguage<L extends string, V extends string>(lang: L, variant: V): { "Content-Language": `${Lowercase<L>}-${Uppercase<V>}`; };
    static contentLanguage<L extends string, V extends string>(lang: L, variant?: V): { "Content-Language": `${Lowercase<L>}` | `${Lowercase<L>}-${Uppercase<V>}`; } {
        if (variant === undefined) return { "Content-Language": `${lang.toLowerCase() as Lowercase<L>}` };
        return { "Content-Language": `${lang.toLowerCase() as Lowercase<L>}-${variant.toUpperCase() as Uppercase<V>}` };
    }

    static serverHeader(product: string = "anelsonia2") { return { "Server": product }; }

    static location(url: string) { return { "Location": url }; }

    static acceptRanges(range: string) { return { "Accept-Ranges": range }; }
}