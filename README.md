# Freesia for Deno: a TypeScript library for building HTTP servers.

![Deno](https://img.shields.io/badge/Deno-Freesia-000000?logo=Deno&style=flat-square)
![version](https://img.shields.io/github/v/tag/qihexiang/freesia?style=flat-square)
![language](https://img.shields.io/github/languages/top/qihexiang/freesia?style=flat-square)
![license](https://img.shields.io/github/license/qihexiang/freesia?style=flat-square)

This is the Freesia library for Deno, which provides an experience similar to
Node.js version. You can load this library directly from GitHub by url
`https://deno.land/x/freesia`.

> This project is still under developing, specify a commit id to access it or
> clone its deno branch as a submodule if you want to use in production.

Here is a simple example:

```ts
import {
    createRes,
    createSwRtX,
    EntryPoint,
    Get,
    parseURL,
    shimHTTP,
} from "https://deno.land/x/freesia";
import { serve } from "https://deno.land/std@0.127.0/http/server.ts";

const { switcher } = createSwRtX<string, Request>()
    .route(
        "/hello/:<username>",
        Get(async ({ username }) => createRes(`hello, ${username}`)),
    )
    .fallback(async (url, req) => createRes(404, `Can't ${req.method} ${url}`));

const main: EntryPoint = async (req) => {
    const { pathname } = parseURL(req);
    return switcher(pathname, req);
};

serve(shimHTTP(main), { port: 8000 });
```

> Be aware of that Freesia for Deno has no magical functions.

## Basic

When using Freesia, there is nothing like `app` object in express or koa. You
need to write the entry function to handle request by your self. It should
receive a parameter in type `HttpReq` (it's the union type of http and http2
request type), and return an object of `ResponseProps` type in asynchorous way.
After that, you can use `shimHTTP` to transform it to a handler for
`createServer` in `http` or `createSecureServer` in `http2`.

### EntryPoint: main function

`EntryPoint` is a type that describe a main function in `Freesia`, it is defined
as:

```ts
type EntryPoint = (req: HttpReq) => Promise<ResponseProps>;
```

You need to implement a function of this type, to describe how you deal with a
request.

Process of this function and all function called by it (directly and indirectly)
is a request handling process. Some special functions provided by freesia can be
called only inside of this process.

### ResponseProps and Respond

`ResponseProps` is a interface of response object, it includes 4 properties:

- `status` valid http status code
- `statusText` status message, can be set to `undefined`, and it's not work with
  HTTP/2
- `body` response body, can be a `string`, `Buffer` or a `Readable` stream, or
  `undefined`
- `headers` response headers, type of it is
  `Record<string, string | string[] | number>`

It's difficult to create and operate such an object manually, and Freesia
provides a interface with methods named `Respond`

It's difficult to create and operate such an object manually, and Freesia
provides a interface `Respond` which has some methods to modify the object.

```ts
const response = createRes()
    .setStatus(200)
    .setStatusText("Ok")
    .setBody("hello, world.")
    .setHeaders("Content-Type", "text/plain; charset=UTF-8")
    .setHeaders("Content-Length", 13);
```

The interface of `Respond` is extended from `ResponseProps` interface, and you
can use `setXXX` methods to operate it.

Except `setHeaders`, all other `setXXX` functions will replace existed value in
the object and `setHeaders` will merge headers set newly into the existed
headers. `setHeaders` provides many format of input, you can learn from
[API document](https://doc.deno.land/https://deno.land/x/freesia/mod.ts/~/Respond#setHeaders)

`createRes` function provides many overloads to help developers create such an
object easily:

```ts
export function createRes(): Respond; // This will give you an empty response with 404
export function createRes(code: number): Respond; // This will give you a response with specified status
export function createRes(body: ResponseBody): Respond; // This will give a response with specify body and status 200
export function createRes(code: number, body: ResponseBody): Respond; // specify status and body
export function createRes(code: number, headers: Headers): Respond; // specify status and headers
export function createRes(body: ResponseBody, headers: Headers): Respond; // specify body and headers, default status is 200
export function createRes(
    code: number,
    body: ResponseBody,
    headers: Headers,
): Respond; // specify status, body and headers
```

`Status` is a enum of HTTP status codes, for example, `Status.NotFound` is
`404`, `Status.Ok` is `200`. If you think this is more Readable, you can use it
to set status code instead of numbers.

`Status` is a enum of HTTP status codes, for example, `Status.NotFound` is
`404`, `Status.Ok` is `200`. If you think this is more Readable, you can use it
to set status code instead of numbers.

### shimHTTP

With upon introduction, it's not difficult to create your first main function:

```ts
// main.ts
export const main: EntryPoint = async (req) => createRes("hello, world");
```

And then we transfrom it to a handler that can be used by `serve` function:

```ts
// server.ts
import main from "./main.ts";
import { shimHTTP } from "https://deno.land/x/freesia";
import { serve } from "https://deno.land/std@0.127.0/http/server.ts";
serve(shimHTTP(main), { port: 8000 });
```

Now it works! You created your first Freesia app.

But we still have lots of things to do, please follow this introduction.

## Routes

### createRoute

A route can be described with a path matching pattern and a handler, for
example, you may need a route that can say hello to the user, like this:

> Browser: GET /hello/mary\
> Server: hello, mary

With `createRoute` function, you can create such a route like this:

```ts
export const helloRoute = createRoute(
    "/hello/:<username>",
    ({ username }) => createRes(`hello, ${username}`),
);
```

The handler parameters will be inferred automatically by the path pattern you
give. Route params can be described in such ways:

- `:<ParamName>` match at least one characters and stop at the first `/` found:
  - `/user/:<username>` can match `/user/hexiang` `(username` is `"hexiang"`) and
    `/user/hexiang/` (`username` is `"hexiang"`), but can't match `/user/hexiang/avatar`
  - `/user/<username>/` can match `/user/hexiang/` (`username` is `"hexiang"`), and can't match `/user/hexiang`
- `:{ParamName}` greedily match at least one characters:
  - `/user/:<username>/:{rest}/` can match `/user/hexiang/avatar/` (`rest` is
    `"avatar"`) and `/user/hexiang/info/gender/` (`rest` is `"info/gender"`)
  - `/user/:<username>/:{rest}` can match `/user/hexiang/avatar/` (`rest` is
    `"avatar/"`) and `/user/hexiang/info/gender/` (`rest` is `"info/gender/"`)
- `:[ParamName]` greedily match at least zero characters:
  - `/files/:[filepath]` can match `/files/README.md` and `/files/` (`filepath`
    is `""`, and you may like to give a list of files under root directory under
    this situation).
- `:(ParamName)` greedily match at least zero characters, the slash before it can be non-existed:
  - `/files/:(filepath)` can match `/files/README.md` and `/files` (`filepath`
    is `undefied`, and you may like to give a list of files under root directory under
    this situation).

`createRoute` returns a function that receive a string as paramters, and can
return what the given handler returns (anything, not only objects created by
`createRes`) if the string matched given pattern. If not matched, the function
will return `null`. You can define many routes in practice:

```ts
const helloRoute = createRoute(
    "/hello/:<username>",
    ({ username }) => `hello, ${username}`,
);
const goodByeRoute = createRoute(
    "/goodbye/:<username>",
    ({ username }) => `goodbye, ${username}`,
);

const main = async (req: HttpReq) => {
    const { pathname } = parseURL(req);
    const message = helloRoute(pathname) ??
        goodbyeRoute(pathname) ??
        /**
         * each route function can return null,
         * you must handle it.
         */
        "No route matched";
    return createRes(message);
};
```

You'll mention that `req.url` in Deno is different from Node.js, it is a full
url, which includes protocol, hostname, pathname and search params, so we need
to use `new URL(req.url)` to get `pathname` before routing, or use parseURL
function to generate a `URL` object from `req`.

### createSwitcher

As you see, we need to give `pathname` to each route function, that's not good.
Freesia provides a function called `createSwitcher` to solve this problem. It
can connect many routes together:

```ts
const helloRoute = createRoute(
    "/hello/:<username>",
    ({ username }) => `hello, ${username}`,
);
const goodByeRoute = createRoute(
    "/goodbye/:<username>",
    ({ username }) => `goodbye, ${username}`,
);
const switcher = createSwitcher(helloRoute, goodByeRoute);

const main = async (req: HttpReq) => {
    const { pathname } = parseURL(req);
    const message = switcher(pathname) ??
        /**
         * each route function can return null,
         * you must handle it.
         */
        "No route matched";
    return createRes(message);
};
```

`createSwitcher` returns another route function that connected to all given
route functions. All given route functions should have same return type, or you
can specify the Union-Type in `createSwitcher<T>`.

### createSwRt

Another way to create switchers is using `createSwRt`, you can create routes and
connect them to switcher at the same time.

```ts
const { switcher } = createSwRt<string, Request>()
    .route("/hello/:<username>", ({ username }) => `hello, ${username}`)
    .route("/goodbye/:<username>", ({ username }) => `goodbye, ${username}`)
    /**
     * fallback method will return a route function that will not return null,
     * if no patter matched, it will execute the fallback handler. If you don't
     * use fallback method, the switcher can still return null.
     */
    .fallback((url) => `No pattern matched ${url}`);

const main = async (req: HttpReq) => {
    const { pathname } = parseURL(req);
    const message = switcher(pathname);
    return createRes(message);
};
```

### X series route creators

In practice, we need always pass `req` object as parameters, but either route
handler or generated route function don't have arguments to receive it. A simple
way to resolve this problem is define route in the scope where `req` object
exists:

```ts
import helloHandler from "./handler/hello";
import goodByeRoute from "./route/goodBye";

const main = async (req: HttpReq) => {
    const helloRoute = createRoute(
        "/hello/:<username>",
        ({ username }) => helloHandler(username, req),
    );
    const switcher = createSwitcher(helloRoute, goodByeRoute);
    return createRes(switcher(parseURL(req).pathname) ?? "No route matched");
};
```

But that means every time a request comes in, a new router function need to be
create, it's awful. On the other hand, if there are many routes need such an
extra parameter, code will be difficult to organize.

Freesia provides X-series route creators to solve this problem. They are
`createRouteX`, `createSwitcherX` and `createSwRtX`. Handlers use be routes
created by X-series creators can receive an extra parameter (can be anything,
not only `req` object), and generated route functions will have an extra
argument and pass it to handlers on routing.

```ts
/**
 * here, helloRoute can receive an extra parameter of HttpReq type.
 */
const helloRoute = createRouteX(
    "/hello/:<username>",
    async ({ username }, req: HttpReq) =>
        `hello, ${username} from, you send content: ${await req.text()}`,
);
const goodByeRoute = createRouteX(
    "/goodbye/:<username>",
    /**
     * It's no problem ignore the extra parameter, it just
     * declare the same type with helloRoute.
     */
    async ({ username }, req: HttpReq) => `goodbye, ${username}`,
);
const switcher = createSwitcherX(helloRoute, goodByeRoute);

const main = async (req: HttpReq) => {
    /**
     * Here, switcher can receive the extra parameter
     */
    const message = switcher(parseURL(req).pathname) ?? "No route matched";
    return createRes(message);
};
```

Example for `createSwRtX`:

```ts
const { switcher } = createSwRtX<string, Request>()
    .route(
        "/hello/:<username>",
        ({ username }, req: HttpReq) =>
            `hello, ${username} from, you send content: ${await req.text()}`,
    )
    // No problem ignore extra parameter
    .route("/goodbye/:<username>", ({ username }) => `goodbye, ${username}`)
    // fallback handler will also  receive the extra parameter
    .fallback(
        (url, req) =>
            `No pattern matched ${url}, your ip is ${req.socket.address().address}`,
    );
const main = async (req: HttpReq) => {
    const message = switcher(parseURL(req).pathname, req);
    return createRes(message);
};
```

### Methods limit

As there is no magical functions, `allowMethods` and `allowMethodsX` dosen't
work in deno version. `allowMethods` function for deno is in fact the
non-magical function `allowMethodsN` from `v2` branch. As a result, methods
limit in routing is supported with X series routes only, and the extra parameter
must be `HttpReq`.

```ts
const { switcher } = createSwRtX<string, Request>()
    .route(
        "/hello/:<username>",
        // As you use Get function to wrap the handler, the second parameter of handler is inferred as HttpReq
        Get(
            ({ username }, req) =>
                `hello, ${username} from, you send content: ${await req
                    .text()}`,
        ),
    )
    .route(
        "/goodbye/<username>",
        Get(({ username }) => `goodbye, ${username}`),
    )
    .fallback((url) => `No pattern matched ${url}`);

const main: EntryPoint = async (req) => {
    const message = switcher(parseURL(req).pathname, req) ?? "No route matched";
    return createRes(message);
};
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

### Computation

`compute` can create `Computation<T>` object.

```ts
const credentialInfo = compute(tokenBuf) // Computation<Buffer>
    .map((buf) => buf.toString("utf-8")) // Computation<string>
    .map(parseToken) // Computation<Promise<Token | null>>
    .aMapSkipNull((token) => (outDated(token) ? null : token)) // Computation<Promise<Token | null>>
    .aMapSkipNull((token) => token.username).value; // Promise<string | null>
```

It has 4 methods：

- map：use a function to deal with internal value
- mapSkipNull：use a function to deal with internal value, but left origin value
  if it's undefined and null
- aMap： unpack the Promise and use function to deal with the value, and use
  Promise to wrap the result.
- aMapSkipNull：unpack the Promise and use function to deal with the value, and
  use Promise to wrap the result. if origin value is
  `undefined | null | Promise<undefined | null>`, keep and wrap to
  `Promise<undefined | null>`.

Each methods will return a new `Computation<T>`, if you pass it two different
chains, they will not influence each other.

Using `computeLazy` can create `Computation<T>` object too.

The difference between `compute` and `computeLazy` is that `compute` will
compute the value every time called method in stream, but `computeLazy` just
compose functions。when you finally access `value` of the object，the composed
functions will be executed. Be careful especailly when functions has
side-effection! Every time you access `value`, composed function will be called.

Just like `Computation`, methods of `Lazy` object will return a new `Lazy`
object, but if you pass a `Lazy` to different chains, the results will not
influence each other only if all functions are pure.

### Effect and Wrapper

Some times we would like to do something before or after a function, but these
logics are not a part of target function, we will find a way to define them in
other places. In other languages, we may use decorators to implement this, but
in TypeScript, decorators can't apply to a simple function. So Freesia provides
two ways to create outside logic of a function.

#### createEffect

`createEffect` can create a wrapper for target function, the wrapper will not
influence the arugment and return value of original function, what the wrapper
do is side-effect.

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
            }ms`,
        );
    };
});

// main.ts
const mainWithVisitLogger = visitLogger(main);
```

In this example, `createEffect` create a wrapper for functions of type
`EntryPoint`. It can access the parameter and return value of origin function,
but unable to change them.

The parameter `hook` is a function (we can call it `beforeHook`) that can get
the paramters of original function, and called before original function. It will
return another function (we can call it `afterHook`) which use original
function's return value as parameter and called after original function, this
function should return void. You can ignore arguments of `beforeHook` and
`afterHook`.

Some times, what we need to do is completely irrelevant to original function, we
can use `createEffect4Any` instead of `createEffect`, the `beforeHook` and
`afterHook` both has no arguments. The function type will not change after
applying the wrapper created by `createEffect4Any`.

> `beforeHook` must be an synchorous function, but `afterHook` can be a
> asynchorous function.

#### createWrapper

Some times we would like to do some pretreatment to function arguments or post
processing to return values, then we use `createWrapper` to create such a
wrapper.

`createWrapper<O, T>` has 2 generic types, `O` is the original function type and
`T` is the wrapped function type. If you don't like to change the type, you can
specify `O` only, default `T` is `O`.

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
        ) {
            response.setHeaders(["Content-Type", "text/plain; charset=UTF-8"]);
        }
        return response;
    },
]);
```

The `beforeHook` should receive parameters of type `T`, and return a
`BeforeHookTuple<O, T>`, It has 3 pattern:

- Full pattern: `[[Parameters<O>], (res: ReturnType<O>) => ReturnType<T>]`, the
  first element is parameters need to pass to original function, the second
  element is the `afterHook` called after original function, it returns the
  value of wrapped function.
- Block pattern: `[null, () => ReturnType<T>]`, if first element is `null`, the
  original function won't be called, and `afterHook` should has no arguments.
- Pretreatment only pattern: `[[Parameters<O>]]` if you don't want to change the
  return value, you can ignore the `afterHook`.

> If at least one of `beforeHook`, `afterHook` and original function is
> asynchorous, the wrapped function (`T`) will return a `Promise`, which means
> `O` and `T` might be unable to be equal.
