# Freesia: a TypeScript library for building Node.js HTTP servers.

Freesia is a library for building Node.js HTTP servers, it provides a way to describe you HTTP handling process in a functional way.

For example, a hello world application in express is like this:

```ts
import express from "express";

const app = express();
app.use((req, res) => {
    res.send("hello, world");
});
app.listen(8000);
```

The handler is a function that returns void, it's strange and un-typed in programming. Using Freesia, you can write like this:

```ts
import { shimHTTP, createRes } from "freesia";
import { createServer } from "http";

createServer(
    shimHTTP(async (req: HttpReq) => createRes("hello, world"))
).listen(8000);
```

It was clear and fully typed.

## Basic

When using Freesia, there is nothing like `app` object in express or koa. You need to write the entry function to handle request by your self. It should receive a parameter in type `HttpReq` (it's the union type of http and http2 request type), and return an object of `ResponseProps` type in asynchorous way. After that, you can use `shimHTTP` to transform it to a handler for `createServer` in `http` or `createSecureServer` in `http2`.

### EntryPoint: main function

`EntryPoint` is a type that describe a main function in `Freesia`, it is defined as:

```ts
type EntryPoint = (req: HttpReq) => Promise<ResponseProps>;
```

You need to implement a function of this type, to describe how you deal with a request.

Process of this function and all function called by it (directly and indirectly) is a request handling process. Some special functions provided by freesia can be called only inside of this process.

### ResponseProps and Respond

`ResponseProps` is a interface of response object, it includes 4 properties:

-   `statusCode` valid http status code
-   `statusMessage` status message, can be set to `undefined`, and it's not work with HTTP/2
-   `body` response body, can be a `string`, `Buffer` or a `Readable` stream, or `undefined`
-   `headers` response headers, type of it is `Record<string, string>`

It's difficult to create and operate such an object manually, and Freesia provides a interface `Respond` which has some methods to modify the object.

```ts
const response = createRes()
    .setStatusCode(200)
    .setStatusMessage("Ok")
    .setBody("hello, world.")
    .setHeaders("Content-Type", "text/plain; charset=UTF-8")
    .setHeaders("Content-Length", 13);
```

The interface of `Respond` is extended from `ResponseProps` interface, and you can use `setXXX` methods to operate it.

Except `setHeaders`, all other `setXXX` functions will replace existed value in the object and `setHeaders` will merge headers set newly into the existed headers. `setHeaders` provides many format of input, you can learn from [API document](https://qihexiang.github.io/freesia/classes/Respond.html#setHeaders)

`createRes` function provides many overloads to help developers create such an object easily:

```ts
export function createRes(): Respond; // This will give you an empty response with 404
export function createRes(code: Status): Respond; // This will give you a response with specified status
export function createRes(body: ResponseBody): Respond; // This will give a response with specify body and status 200
export function createRes(code: Status, body: ResponseBody): Respond; // specify status and body
export function createRes(code: Status, headers: Headers): Respond; // specify status and headers
export function createRes(body: ResponseBody, headers: Headers): Respond; // specify body and headers, default status is 200
```

`Status` is a enum of HTTP status codes, for example, `Status.NotFound` is `404`, `Status.Ok` is `200`. If you think this is more Readable, you can use it to set status code instead of numbers.

### shimHTTP

With upon introduction, it's not difficult to create your first main function:

```ts
export const main: EntryPoint = async (req) => createRes("hello, world");
```

Every time a request come in, we want to execute this function to handle it, but `EntryPoint` is not work with Node.js `http` or `http2` module. Now shimHTTP works, it can transform an `EntryPoint` to a request handler of `http` or `http2` module.

```ts
// server.ts
import { main } from "./main.ts";
import { shimHTTP } from "freesia";
import { createServer } from "http";

createServer(shimHTTP(main)).listen(8000);
```

Now it works! You created your first Freesia app.

But we still have lots of things to do, please follow this introduction.

## Routes

### createRoute

A route can be described with a path matching pattern and a handler, for example, you may need a route that can say hello to the user, like this:

> Browser: GET /hello/mary  
> Server: hello, mary

With `createRoute` function, you can create such a route like this:

```ts
export const helloRoute = createRoute("/hello/<username>", ({ username }) =>
    createRes(`hello, ${username}`)
);
```

The handler parameters will be inferred automatically by the path pattern you gave. Route params can be described in such ways:

-   `<ParamName>` non-greedily match at least one characters:
    -   `/user/<username>` can match `/user/hexiang` (`username` is `"hexiang"`) and `/user/hexiang/avatar` (`username` is `"hexiang/avatar"`)
    -   `/user/<username>/` can match `/user/hexiang/` (`username` is `"hexiang"`) but can't match `/user/hexiang/avatar` (un-matched after the third slash).
-   `<[ParamName]>` greedily match at least one characters:
    -   `/user/<username>/<[rest]>/` can match `/user/hexiang/avatar/` (`rest` is `"avatar"`) and `/user/hexiang/info/gender/` (`rest` is `"info/gender"`)
-   `[ParamName]` greedily match at least zero characters:
    -   `/files/[filepath]` can match `/files/README.md` and `/files/` (`filepath` is `""`, and you may like to give a list of files under root directory under this situation).

`createRoute` returns a function that receive a string as paramters, and can return what the given handler returns (anything, not only objects created by `createRes`) if the string matched given pattern. If not matched, the function will return `null`. You can define many routes in practice:

```ts
const helloRoute = createRoute(
    "/hello/<username>",
    ({ username }) => `hello, ${username}`
);
const goodByeRoute = createRoute(
    "/goodbye/<username>",
    ({ username }) => `goodbye, ${username}`
);

const main = async (req: HttpReq) => {
    const message =
        helloRoute(req.url ?? "/") ??
        goodbyeRoute(req.url ?? "/") ??
        /**
         * each route function can return null,
         * you must handle it.
         */
        "No route matched";
    return createRes(message);
};
```

### createSwitcher

As you see, we need to give `req.url` to each route function, that's not good. Freesia provides a function called `createSwitcher` to solve this problem. It can select the right route by given string:

```ts
const helloRoute = createRoute(
    "/hello/<username>",
    ({ username }) => `hello, ${username}`
);
const goodByeRoute = createRoute(
    "/goodbye/<username>",
    ({ username }) => `goodbye, ${username}`
);
const switcher = createSwitcher(helloRoute, goodByeRoute);

const main = async (req: HttpReq) => {
    const message =
        switcher(req.url ?? "/") ??
        /**
         * each route function can return null,
         * you must handle it.
         */
        "No route matched";
    return createRes(message);
};
```

`createSwitcher` returns another route function that connected to all given route functions. All given route functions should have same return type, or you can specify the Union-Type in `createSwitcher<T>`.

### createSwRt

Another way to create switchers is using `createSwRt`, you can create routes and connect them to switcher at the same time.

`createSwRt` is both a function and a namespace, `createSwRt()` is equals to `createSwRt`.

```ts
const { switcher } = createSwRt
    .route("/hello/<username>", ({ username }) => `hello, ${username}`)
    .route("/goodbye/<username>", ({ username }) => `goodbye, ${username}`)
    /**
     * fallback method will return a route function that will not return null,
     * if no patter matched, it will execute the fallback handler. If you don't
     * use fallback method, the switcher can still return null.
     */
    .fallback((url) => `No pattern matched ${url}`);

const main = async (req: HttpReq) => {
    const message = switcher(req.url ?? "/");
    return createRes(message);
};
```

The return type is inferred by the first called `route` method, if you'd like to specify a union-type as generic type, use `route<T>`.

### X series route creators

Some times, route handlers might need arguments which can only accessed in request handling functions. If we define route or switchers outside handler functions, it's not easy to get these values.

For example, if you'd like to get IP address in handler of `helloRoute`, you must define it like this:

```ts
import goodByeRoute from "./route/goodBye";

const main = async (req: HttpReq) => {
    const helloRoute = createRoute(
        "/hello/<username>",
        ({ username }) =>
            `hello, ${username} from ${req.socket.address().address}`
    );
    const switcher = createSwitcher(helloRoute, goodByeRoute);
    return createRes(switcher(req.url ?? "/") ?? "No route matched");
};
```

It's of course not a good idea creating a route each time request come in. But you can use `createRouteX` to create a route function that can receive an extra param and pass to handlers:

```ts
/**
 * here, helloRoute can receive an extra parameter of HttpReq type.
 */
const helloRoute = createRouteX(
    "/hello/<username>",
    ({ username }, req: HttpReq) =>
        `hello, ${username} from ${req.socket.address().address}`
);
const goodByeRoute = createRouteX(
    "/goodbye/<username>",
    /**
     * It's no problem ignore the extra parameter, it just
     * declare the same type with helloRoute.
     */
    ({ username }, req: HttpReq) => `goodbye, ${username}`
);
const switcher = createSwitcherX(helloRoute, goodByeRoute);

const main = async (req: HttpReq) => {
    /**
     * Here, switcher can receive the extra parameter
     */
    const message = switcher(req.url ?? "/", req) ?? "No route matched";
    return createRes(message);
};
```

There is also `createSwRtX`:

```ts
const { switcher } = createSwRtX
    .route(
        "/hello/<username>",
        ({ username }, req: HttpReq) =>
            `hello, ${username} from ${req.socket.address().address}`
    )
    // No problem ignore extra parameter
    .route("/goodbye/<username>", ({ username }) => `goodbye, ${username}`)
    // fallback handler will also  receive the extra parameter
    .fallback(
        (url, req) =>
            `No pattern matched ${url}, your ip is ${
                req.socket.address().address
            }`
    );
const main = async (req: HttpReq) => {
    const message = switcher(req.url ?? "/", req);
    return createRes(message);
};
```

## Magical functions

Freesia provides some magical functions, which provides a way to access values of current handling request without pass `req` as parameters.

### useRequest

`useRequest` is the core magical function, all magical function depends on it. In situations what `useRequest` doesn't work, all other magical function will not work either.

`useRequest` can be called only in the function called by main function that use as parameter of `shimHTTP`. `useRequest` provides a way to get `req` object, while you don't pass it as parameters.

Such code is ok:

```ts
createServer(
    shimHTTP(async (req) => {
        return layer1();
    })
).listen(8000);

function layer1() {
    return layer2();
}

function layer2() {
    return layer3();
}

/**
 * layer3 is called by main function, though indirectly,
 * it can access `req` by `useRequest`
 */
function layer3() {
    const req = useRequest();
    return createRes(req.socket.address().address);
}
```

But is not ok in this:

```ts
databse
    .connect()
    .then((db) => {
        /**
         * function here is not related to any request,
         * `useRequest` will throw an error.
         */
        const req = useRequest();
        console.log(JSON.stringify(req.socket.address()));
        createServer(
            shimHTTP(async () => {
                return createRes(404, "Not found");
            })
        ).listen(8000);
    })
    .catch(console.error);
```

### useURL

`useURL` provides a way to access request url info. Visit API documents [here](https://qihexiang.github.io/freesia/modules.html#useURL).

## Pre-magical functions

Pre-magical functions are non-magical so they can be called outside of request process handling, but they return magical functions.

### createFlare

createFlare provides a way to declare and access a value for an request handling process.

```ts
export const [assign, observe, drop] = createFlare<Buffer>({
    reassign: true,
    mutable: false,
});

const main = async (req: HttpReq) => {
    const body = await getRawBody(req);
    assign(body);
    /**
     * fn1, fn2, fn3 and functions called by them can access body
     * by observe function.
     */
    const a = fn1();
    const b = fn2();
    const c = fn3();
    drop();
    return createRes(200, "success");
};
```

`createFlare` can receive a object parameter which as two properties:

-   `reassign` means you can call `assign` many times to reset the value before call `drop` to release it, set it to `true` when you need to change a primitive value during the process;
-   `mutable` means the value get from `observe` should **not** be readonly. It in fact do nothing, and just change the return type of `observe` in TypeScript. For example, if you assign a ORM object to flare, you should set `mutable` to `true`.

The three functions return by `createFlare` is:

-   `assign` assign a value to the flare for current request.
-   `observe` get the value assigned to the flare.
-   `drop` deattach the value from the flare, value will not unaccessable after called drop.

> This is implemented by `WeakMap`, so it's unnecessary to call `drop`.

### allowMethods and allowMethodsX

These two functions can limits the request methods of handlers binding to routes. For example:

```ts
const { switcher } = createSwRt
    .route(
        "/hello/<username>".allowMethods(
            ({ username }) => `hello, ${username}`,
            ["GET"]
        )
    )
    .route(
        "/goodbye/<username>",
        allowMethods(({ username }) => `goodbye, ${username}`, ["GET"])
    )
    /**
     * fallback method will return a route function that will not return null,
     * if no patter matched, it will execute the fallback handler. If you don't
     * use fallback method, the switcher can still return null.
     */
    .fallback((url) => `No pattern matched ${url}`);

const main = async (req: HttpReq) => {
    const message = switcher(req.url ?? "/");
    return createRes(message);
};
```

You can use `allowMethodsX` for X series functions.

Here are some shortcuts, like: `Get`, `GetX`, `Post`, `PostX`, etc. `All` and `AllX` cover request methods described [here](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Methods).

## No magical mode

Magical functions are implemented by Node.js `async_hooks` API, as a result your application might be slow down. If you'd like to build your application without magical functions to get better performance, you can pass a `noMagical` option to `shimHTTP`, like this:

```ts
createServer(shimHTTP(main, { noMagical: true })).listen(8000);
```

## Utils

### composeFn

`composeFn` provides a way to connect functions together.

```ts
const { fn } = composeFn((x: number) => x + 1)
    .next((x) => Math.pow(x, 2))
    .next((x) => x * 4)
    .next((x) => `final result is ${x}`);

fn(1); // -> "final result is 16"
```

### Computation and Lazy

#### Computation

`compute` can create `Computation<T>` object.

```ts
const credentialInfo = compute(tokenBuf) // Computation<Buffer>
    .map((buf) => buf.toString("utf-8")) // Computation<string>
    .map(parseToken) // Computation<Promise<Token | null>>
    .aMapSkipNull((token) => (outDated(token) ? null : token)) // Computation<Promise<Token | null>>
    .aMapSkipNull((token) => token.username).value; // Promise<string | null>
```

It has 4 methods：

-   map：use a function to deal with internal value
-   mapSkipNull：use a function to deal with internal value,
    but left origin value if it's undefined and null
-   aMap： unpack the Promise and use function to deal with the
    value, and use Promise to wrap the result.
-   aMapSkipNull：unpack the Promise and use function to deal
    with the value, and use Promise to wrap the result. if
    origin value is `undefined | null | Promise<undefined | null>`,
    keep and wrap to `Promise<undefined | null>`.

Each methods will return a new `Computation<T>`, if you pass it two different chains, they will not influence each other.

#### Lazy

Using `computeLazy` to create `Lazy<T>` object，it provides methods as the same as `Computation`.

The difference between `Computation` and `Lazy` is that `Computation` will compute the value every time called method in chain, but `Lazy` just compose functions。when you finally access `value` in `Lazy` object，the composed functions will be executed. Be careful especailly when functions has side-effection! Every time you access `value`, composed function will be called.

Just like `Computation`, methods of `Lazy` object will return a new `Lazy` object, but if you pass a `Lazy` to different chains, the results will not influence each other only if all functions are pure.

### Effect and Wrapper

Some times we would like to do something before or after a function, but these logics are not a part of target function, we will find a way to define them in other places. In other languages, we may use decorators to implement this, but in TypeScript, decorators can't apply to a simple function. So Freesia provides two ways to create outside logic of a function.

#### createEffect

`createEffect` can create a wrapper for target function, the wrapper will not influence the arugment and return value of original function, what the wrapper do is side-effect.

```ts
// visitLogger.ts
export const visitLogger = createEffect<EntryPoint>((req) => {
    const path = useURL("path");
    const reqComeIn = new Date();
    return async (res) => {
        const { statusCode } = await res;
        const resGoOut = new Date().getTime();
        console.log(
            `${reqComeIn.toLocaleString()} ${path} ${statusCode} ${
                resGoOut - reqComeIn.getTime()
            }ms`
        );
    };
});

// main.ts
const mainWithVisitLogger = visitLogger(main);
```

In this example, `createEffect` create a wrapper for functions of type `EntryPoint`. It can access the parameter and return value of origin function, but unable to change them.

The parameter `hook` is a function (we can call it `beforeHook`) that can get the paramters of original function, and called before original function. It will return another function (we can call it `afterHook`) which use original function's return value as parameter and called after original function, this function should return void. You can ignore arguments of `beforeHook` and `afterHook`.

Some times, what we need to do is completely irrelevant to original function, we can use `createEffect4Any` instead of `createEffect`, the `beforeHook` and `afterHook` both has no arguments. The function type will not change after applying the wrapper created by `createEffect4Any`.

> `beforeHook` must be an synchorous function, `afterHook` can be a asynchorous function but wrapped function won't wait for it resolving.

#### createWrapper

Some times we would like to do some pretreatment to function arguments or post processing to return values, then we use `createWrapper` to create such a wrapper.

`createWrapper<O, T>` has 2 generic types, `O` is the original function type and `T` is the wrapped function type. If you don't like to change the type, you can specify `O` only, default `T` is `O`.

```ts
export const useAutoPlainText = createWrapper<
    (req: HttpReq) => Promise<Respond>
>((req) => [
    [req],
    async (res) => {
        const response = await res;
        if (
            typeof response.body === "string" &&
            !("Content-Type" in response.headers)
        )
            response.setHeaders(["Content-Type", "text/plain; charset=UTF-8"]);
        return response;
    },
]);
```

The `beforeHook` should receive parameters of type `T`, and return a `BeforeHookTuple<O, T>`, It has 3 pattern:

-   Full pattern: `[[Parameters<O>], (res: ReturnType<O>) => ReturnType<T>]`, the first element is parameters need to pass to original function, the second element is the `afterHook` called after original function, it returns the value of wrapped function.
-   Block pattern: `[null, () => ReturnType<T>]`, if first element is `null`, the original function won't be called, and `afterHook` should has no arguments.
-   Pretreatment only pattern: `[[Parameters<O>]]` if you don't want to change the return value, you can ignore the `afterHook`.

> If at least one of `beforeHook`, `afterHook` and original function is asynchorous, the wrapped function (`T`) will return a `Promise`, which means `O` and `T` might be unable to be equal.
