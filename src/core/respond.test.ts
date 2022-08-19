import { response } from "./respond";

test("Empty 204 response", () => {
    expect(response(undefined)).toStrictEqual([undefined, 204]);
});

test("hello world with 200 code", () => {
    expect(response("hello, world")).toStrictEqual(["hello, world", 200]);
});

test("hello world with type headers", () => {
    const message = "hello, world";
    expect(
        response(
            message,
            200,
            { "Content-Type": "text/plain" },
            { "Content-Length": String(Buffer.from(message).length) }
        )
    ).toStrictEqual([
        "hello, world",
        200,
        {
            "Content-Type": "text/plain",
        },
        { "Content-Length": "12" },
    ]);
});

test("transform type", () => {
    const originResponse = response({message: "hello, world"})
    const transformedRes = response(originResponse, (body, status, headers) => {
        return response(JSON.stringify(body), status, ...headers, {
            "Content-Type": "application/json"
        })
    })
    expect(transformedRes).toStrictEqual([
        JSON.stringify({message: "hello, world"}), 200, {
            "Content-Type": "application/json"
        }
    ])
})

test("change headers or status", () => {
    const originResponse = response({message: "content not found"}, [404, "Nothing here"])
    const headersChanged = response(originResponse, {"Content-Type": "application/json"})
    const headersAppended = response(headersChanged, {"Keep-Alive": "timeout=5"}, {"Server": "freesia"})
    expect(headersAppended).toStrictEqual([
        {message: "content not found"}, [404, "Nothing here"], {"Content-Type": "application/json"}, {"Keep-Alive": "timeout=5"}, {"Server": "freesia"}
    ])
})
