import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { getType } from "mime";
import { ResponseBody } from "../usr/Basic";
import { stream } from "./stream";
import { httpError } from "./error";

/**
 * Generate a file response.
 * 
 * @param path The path of the file you want to send.
 * @returns A ResponseBody includes a Readable stream 
 * or a HTTP error ResponseBody if file not exits or not a regular file.
 */
export async function file(path: string): Promise<ResponseBody> {
    try {
        if (!(await stat(path)).isFile()) return httpError(403, "Not a regular file.");
        const rStream = createReadStream(path);
        const resBody = stream(rStream);
        resBody.headers["Content-Type"] = getType(path) || "application/octect-stream";
        return resBody;
    } catch (err) {
        return httpError(404, "File not found");
    }
}
