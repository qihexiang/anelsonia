import { ResponseBody } from "../usr/Basic";
import HttpStatus from "../usr/HTTPCodes";

/**
 * Generate a text response.
 * 
 * @param content The content you want to send.
 * @param mime You can specify the MIME name after "text/" here.
 * @returns A ResponseBody of text.
 */
export function text(content: string, mime: "html"|"plain"|"javascript"|"css" = "plain"): ResponseBody {
    return {
        statusCode: 200,
        statusMessage: HttpStatus[200],
        headers: {"Content-Type": `text/${mime}`},
        data: content
    }
}

/**
 * Generate a HTML response.
 * 
 * @param content The HTML content you want to send.
 * @returns A ResponseBody of HTML.
 */
export function html(content: string) {
    return text(content, "html")
}

/**
 * Generate a JavaScript response.
 * 
 * @param content The JavaScript content you want to send.
 * @returns A ResponseBody of JavaScript/
 */
export function js(content: string) {
    return text(content, "javascript")
}

/**
 * Generate a CSS response.
 * 
 * @param content The CSS content you want to send.
 * @returns A ResponseBody of CSS.
 */
export function css(content: string) {
    return text(content, "css")
}
