import { text, html, css, js } from "./text";
import { json } from "./json";
import { stream, buffer } from "./stream";
import { file } from "./file";
import { httpError } from "./error";
export const resBuilder = {
    text, html, css, js, json, stream, buffer, file, httpError
};
export default resBuilder;