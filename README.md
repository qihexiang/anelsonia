# Anelsonia

一个更加简单、静态的Node.js Web框（玩）架（具）。

## 为什么？

Node.js的基础Web框架已经有很多，如最为著名的Express、Koa、Fastify等，这些框架拥有良好的生态，建立起了一系列可靠的应用，但是我不喜欢它们——

自Express框架开始，这一系列洋葱模型的框架有效的利用了JavaScript的动态属性，在运行时将一系列属性绑定到它们的 `req` 、`res` 或是 `ctx` 属性上，直到服务启动之前——不，更准确的来说，当请求进入到你所设定的路径之前，你是无法知道动态绑定的属性和功能是否正常工作的。这对于TypeScript开发来说其实挺令人烦恼。

除此之外，路由这一需求实际上也和洋葱模型格格不入：一旦存在路由分支，各个路由之间的逻辑关系显然就不再“洋葱”了。而就算没有这些路由，洋葱模型也并不是真的很实用，相当数量的中间件：例如响应内容压缩、请求内容解析，都并不是真的需要在进站和出站时都要进行的，但是因为框架是洋葱模型的，因此不得不设计成洋葱中的一层。

不管上面的理由是否真的有道理，总之我认为一个HTTP请求的处理过程，是可以用函数式风格的代码来表达的，因此做了这个框架。

~~当然啦，我很菜，所以这个框架可能既不OOP也不FP，feature少bug多，还请见谅啦。~~

我又觉得我行了。

## hello, world

处理请求的入口函数，应该实现接口 `EntryPoint` ，你可以在编辑器中先引入这个接口来帮助你完成这个函数：

```typescript
import { EntryPoint } from "anelsonia"
const entry: EntryPoint = (req) => {
    return {
        statusCode: 200,
        statusMessage: "Ok",
        headers: { "Content-Type": "text/plain" },
        data: "hello, world\n"
    }
}
```

这个函数只有一个参数，即 `req`，它是 `http` 模块的 `IncomingMessage` 接口的实现；函数的返回值是接口 `ResponseBody` 的实现，它的定义如下：

```typescript
interface ResponseBody {
    statusCode: number;
    statusMessage: string;
    headers: OutgoingHttpHeaders;
    data: string | Buffer | Readable;
}
```

要更为简化的定义 `statusMessage` 属性，可以使用本框架导出的 `HttpStatus` 对象来获取对应的默认消息，例如 `HttpStatus[200]` 的值是 `'Ok'` ， `HttpStatus[404]` 的值是 `'Not found'` 。

不过，这样的返回方式依然较为麻烦，因此框架中提供了一些快速生成状态为 `200` ，消息为 `Ok`，并在 `headers` 中设置正确的 `"Content-Type"` 的 `ResponseBody`的函数。

这些函数，可以从 `resBuilder` 中获得，例如上面的案例，可以变化为：

```typescript
import { EntryPoint, resBuilder } from "anelsonia"

const entry: EntryPoint = (req) => {
    return resBuilder.text("hello, world\n")
}
```

要建立一个完整的服务，需要建立一个服务器，可以写成如下样式：

```typescript
import { createServer, EntryPoint, resBuilder } from "anelsonia"

const entry: EntryPoint = (req) => {
    return resBuilder.text("hello, world\n")
}

const server = createServer(entry)
server.listen(8080)
```

注意，`server` 实际上是一个标准的 `http` 模块的 `Server` 实例。

要更加细致的控制建立流程，你可以利用 `genBaseHandler` 将 `EntryPoint` 实例转化为 `RequestHandler` 实例，然后传入服务器：

```typescript
import { createServer } from "http"
import { genBaseHandler, EntryPoint, resBuilder } from "anelsonia"

const entry: EntryPoint = (req) => {
    return resBuilder.text("hello, world\n")
}

const httpHandler = genBaseHandler(entry)

const server = createServer(httpHandler)
server.listen(8080)
```

## 路由

使用 `createRouter` 函数构建一个路由，使用路由返回的 `routeMatcher` 可以传入 `url` 变量用于匹配和解析，传入的 `handler` 是 `RouteHandler` 的实现用于处理对应路由下的操作。 `routeMatcher` 的返回值取决于 `handler` 的返回值，例如下面的案例中匹配上的路由会返回 `ResponseBody` 或 `Promise<ResponseBody>`，没有的则返回 `null`。

```typescript
import { createServer, EntryPoint, resBuilder, createRouter, RouteHandler, ResponseBody } from "anelsonia";
import { errorHandler } from "./errorHandler";
import { fileHandler } from "./fileHandler";
import { helloHandler } from "./helloHandler";

const helloRoute = createRouter("/hello/:username");
const fileRouter = createRouter("/public/(.*)");
const fileFallbackRouter = createRouter("/public")
const errorTest = createRouter("/error/:errCode");

const entry: EntryPoint = async (req) => {
    const url = req.url ?? "/";
    return helloRoute(url, (p, q) => helloHandler(p, q, req))
        || fileRouter(url, fileHandler)
        || fileFallbackRouter(url, (p, q) => {
            return resBuilder.redirection(
                302, "http://" + req.headers.host + "/public/", ""
            )
        })
        || errorTest(url, errorHandler)
        || resBuilder.httpError(404);
};

createServer(entry).listen(8080);
```
### 匹配语法

因为使用了和Express一样的 `path-to-regexp` 库，因此可以使用完全一样的方式构建路由。

### RouteHandler和路由参数

`pathParams` 参数是路由参数，它是一个 `Map` 对象，使用 `get` 方法从其中获取值（字符串），利用 `forEach` 遍历键值对， `searchParams` 是查询参数，它是一个 `URLSearchParams` 实现，它和 `Map` 对象的用法基本一致。

如果想要直接返回 `pathParams` 或 `searchParams` 而不经过特别的 `RouteHandler`，可以使用导出的 `getParams` 作为 `handler` 参数的值。

`RouteHndler` 并不一定要返回一个 `ResponseBody` 的实现，也可以返回任意值作为一个处理过程的中间量。

`RouteHandler` 可以接受超过两个参数，可以使用箭头函数来进行传参，如上面的 `helloHandler` ，它对应的定义如下：

```typescript
import { resBuilder, ResponseBody, RouteHandler } from "anelsonia";
import { IncomingMessage } from "http";
import getRawBody from "raw-body";

export const helloHandler: RouteHandler<ResponseBody | null> = async (p, q, req: IncomingMessage) => {
    const username = p.get("username");
    const message = q.get("message");
    if (req.method == "post") console.log((await getRawBody(req)).toString());
    if (!(username && message)) {
        return null;
    } else {
        return resBuilder.json({ username, message, date: new Date() });
    }
};
```

特别需要注意的是，路由控制器和入口函数都可以是异步函数，且特别建议将入口函数设置为异步函数，以使用 `await` 处理后续的异步动作；于此同时，需要注意 `Promise<null>` 在使用 `||` 进行向后传递时，会被视为 `true` 的结果，如果想要以此方法在进入 `RouteHandler` 后再逃出路由时必须 `await` 。

## resBuilder

resBuilder对象下有以下函数，可返回 `ResponseBody` 的实现：

名称|参数|说明
---|---|---
text|content: stirng, type: string|文本内容相应，指定的类型会被设置为"Content-Type": "text/${type}"，type留空时，默认值为"plain"
html|content: string|响应一个HTML，Content-Type与之对应
css|同上|响应一个CSS，Content-Type与之对应
js|同上|响应一个JavaScript，Content-Type与之对应
json|object: Object|响应一个JSON，响应前会被JSON.stringify转换成字符串
stream|rStream: Readable|返回一个可读流，当其 `"data"` 事件触发时，会写入到响应流中
buffer|buf: Buffer|直接返回Buffer二进制内容，默认的Content-Type和stream方法一样是`application/octect-stream`
file|path: string|构建一个文件读取流，调用stream函数，Content-Type由 `mime.getType` 确定，未知的内容为 `application/octect-stream`。
httpError|code: number, message?: string|返回一个HTTP错误，可以指定状态码和错误信息

注意，因为处理流时对于出错的情况，我是瞎几把处理的（其实就是没处理），不管是手动实现 `ResponseBody` 还是使用我的 `stream` 和 `file` 函数都一样。所以使用前请务必小心并多加测试。

## 建议插件列表

大部分可能用到的插件实际上是Express/Koa的依赖或者依赖的依赖。

目的|插件名称
---|---
Cookie解析|cookie
Body解析|raw-body
设置Content-Type|mime
设置Content-Type|content-type
