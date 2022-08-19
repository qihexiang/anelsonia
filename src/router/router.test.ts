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
    expect(router("/hello/hexiang")).toStrictEqual(response("hello, hexiang"));
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

test("condition tool test (single mode)", () => {
    const os = condition(platform)
        .match("linux", () => "Linux")
        .match("darwin", () => "macOS")
        .match("win32", () => "Windows")
        const maybeVoid = os.getValue()
        expect(maybeVoid === undefined || maybeVoid.match(/(Linux)|(Windows)|(macOS)/)).toBeTruthy();
        expect(os.withDefault(() => "Others")).toMatch(/(Linux)|(Windows)|(macOS)|(Others)/);
});

test("condition tool test (RegExp mode)", () => {
    const currentPlatform = condition(platform)
        .match(/(win32|darwin)/, () => "Desktop")
        .match(/(linux|(net|open|free)bsd)/, () => "Desktop or Server")
        .withDefault(() => "Server");
    expect(currentPlatform).toMatch(/Desktop|(Desktop or Server)/);
});

test("condition tool test (Array mode mode)", () => {
    const currentPlatform = condition(platform)
        .match(["win32", "darwin", "linux"], () => "Desktop")
        .match(
            ["freebsd", "netbsd", "openbsd", "linux"],
            () => "Desktop or Server"
        )
        .withDefault(() => "Server");
    expect(currentPlatform).toMatch(/Desktop|(Desktop or Server)/);
});
