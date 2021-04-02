import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { getType } from "mime";
import { responseBody } from "../usr/Basic";
import { stream } from "./stream";
import { httpError } from "./error";
import { handleErr } from "../utils/handleError";

export async function file(path: string): Promise<responseBody> {
    try {
        if (!(await stat(path)).isFile()) throw new Error("Not a generic file.");
        const rStream = createReadStream(path);
        const resBody = stream(rStream);
        resBody.header["Content-Type"] = getType(path) || 'application/octect-stream';
        return resBody;
    } catch (err) {
        if (err instanceof Error) handleErr(err);
        else handleErr(new Error(err));
        return httpError(404, "File not found");
    }
}
