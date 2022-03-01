import { HttpReq } from "../core/shimHTTP.ts";

export const parseURL = (req: HttpReq) => new URL(req.url);
