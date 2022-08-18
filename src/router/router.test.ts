import { Respond, response } from "../core";
import { condition, createSwRt, createSwRtX } from "./index";
import {platform} from "process"

test("Router creation test", () => {
    const router = createSwRt<Respond<string>>()
        .route("/hello/:username", ({ username }) => {
            return response(`hello, ${username}`);
        })
        .route("/info", () => {
            return response(`This is a test case of freesia`);
        })
        .route("/about", () => {
            return response(undefined, 302, {
                location: "https://github.com/qihexiang/freesia",
            });
        })
        .fallback(() => response("Nothing found"));
    expect(router("/hello/hexiang")).toStrictEqual(["hello, hexiang", 200])
});

test("RouterX creation test", () => {
    const buf = Buffer.from("hello, world\n");
    const router = createSwRtX<Respond<string>, Buffer>()
        .route("/hello/:username", ({ username }, buf) => {
            return response(`hello, ${username}, prepared buffer is ${buf.toString()}`);
        })
        .route("/info", () => {
            return response(`This is a test case of freesia`);
        })
        .route("/about", () => {
            return response(undefined, 302, {
                location: "https://github.com/qihexiang/freesia",
            });
        })
        .fallback(() => response("Nothing found"));
    expect(router("/hello/hexiang", buf)).toStrictEqual(["hello, hexiang, prepared buffer is hello, world\n", 200])
});

test("condition tool test", () => {
    const os = condition(platform)
        .match("linux", () => "Linux")
        .match("darwin", () => "macOS")
        .match("win32", () => "Windows")
        .withDefault(() => "Others")
    expect(os).toMatch(/(Linux)|(Windows)|(macOS)|(Others)/)
})
