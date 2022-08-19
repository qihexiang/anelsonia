import { Respond, response } from "../core";
import { condition, createSwRt, createSwRtX } from "./index";
import { platform } from "process";

test("Router creation test", () => {
    const router = createSwRt<Respond<string>>()
        .route("/hello/:username", ({ username }) => {
            return response(`hello, ${username}`);
        })
        .route("/info", {
            GET: () => {
                return response(`This is a test case of freesia`);
            },
            POST: () => {
                return response(`This is a test case of freesia`);
            },
        })
        .route("/about", () => {
            return response(undefined, 302, {
                location: "https://github.com/qihexiang/freesia",
            });
        })
        .fallback(() => response("Nothing found"));
    expect(router("/hello/hexiang")).toStrictEqual(
        response("hello, hexiang")
    );
});

test("RouterX creation test", () => {
    const buf = Buffer.from("hello, world\n");
    const router = createSwRtX<Respond<string>, Buffer>()
        .route("/hello/:username", ({ username }, buf) => {
            return response(
                `hello, ${username}, prepared buffer is ${buf.toString()}`
            );
        })
        .route("/info", {
            GET: () => {
                return response(`This is a test case of freesia`);
            },
            POST: () => {
                return response(`This is a test case of freesia`);
            },
        })
        .route("/about", () => {
            return response(undefined, 302, {
                location: "https://github.com/qihexiang/freesia",
            });
        })
        .fallback(() => response("Nothing found"));
    expect(router("/hello/hexiang", buf)).toStrictEqual(
        response("hello, hexiang, prepared buffer is hello, world\n")
    );
});

test("condition tool test", () => {
    const os = condition(platform)
        .match("linux", () => "Linux")
        .match("darwin", () => "macOS")
        .match("win32", () => "Windows")
        .withDefault(() => "Others");
    expect(os).toMatch(/(Linux)|(Windows)|(macOS)|(Others)/);
});

test("condition tool test", () => {
    const currentPlatform = condition(platform)
        .match(/(win32|darwin)/, () => "Desktop")
        .withDefault(() => "Server");
    expect(currentPlatform).toMatch(/(Desktop|Server)/);
});
