import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { getType } from "mime";
import { responseBody } from "../usr/Basic";
import { stream } from "./stream";
import { httpError } from "./error";

export async function file(path: string): Promise<responseBody> {
    try {
        await stat(path);
        const rStream = createReadStream(path);
        const resBody = stream(rStream);
        resBody.header["Content-Type"] = getType(path) || 'application/octect-stream';
        return resBody;
    } catch (err) {
        return httpError(404, "File not found");
    }
}
