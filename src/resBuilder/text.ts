import { ResponseBody } from "../usr/Basic";
import HttpStatus from "../usr/HTTPCodes";

export function text(content: string, mime: "html"|"plain"|"javascript"|"css" = "plain"): ResponseBody {
    return {
        statusCode: 200,
        statusMessage: HttpStatus[200],
        header: {"Content-Type": `text/${mime}`},
        data: content
    }
}

export function html(content: string) {
    return text(content, "html")
}

export function js(content: string) {
    return text(content, "javascript")
}

export function css(content: string) {
    return text(content, "css")
}
