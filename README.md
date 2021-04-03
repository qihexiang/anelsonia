# Anelsonia

一个更加简单、静态的Node.js Web框（玩）架（具）。

## 为什么？

Node.js的基础Web框架已经有很多，如最为著名的Express、Koa、Fastify等，这些框架拥有良好的生态，建立起了一系列可靠的应用，但是我不喜欢它们——

自Express框架开始，这一系列洋葱模型的框架有效的利用了JavaScript的动态属性，在运行时将一系列属性绑定到它们的 `req` 、`res` 或是 `ctx` 属性上，直到服务启动之前——不，更准确的来说，当请求进入到你所设定的路径之前，你是无法知道动态绑定的属性和功能是否正常工作的。这对于TypeScript开发来说其实挺令人烦恼。

除此之外，路由这一需求实际上也和洋葱模型格格不入：一旦存在路由分支，各个路由之间的逻辑关系显然就不再“洋葱”了。而就算没有这些路由，洋葱模型也并不是真的很实用，相当数量的中间件：例如响应内容压缩、请求内容解析，都并不是真的需要在进站和出站时都要进行的，但是因为框架是洋葱模型的，因此不得不设计成洋葱中的一层。

不管上面的理由是否真的有道理，总之我认为一个HTTP请求的处理过程，是可以用函数式风格的代码来表达的，因此做了这个框架。

当然啦，我很菜，所以这个框架可能既不OOP也不FP，feature少bug多，还请见谅啦。

由于我会的很少，所以会从传统框架中学习一些东西。

## hello, world

处理请求的入口函数，应该实现接口 `EntryPoint` ，你可以在编辑器中先引入这个接口来帮助你完成这个函数：

```typescript
import { EntryPoint } from "anelsonia"
const entry: EntryPoint = (req) => {
    return {
        statusCode: 200,
        statusMessage: "Ok",
        header: { "Content-Type": "text/plain" },
        data: "hello, world\n"
    }
}
```

这个函数只有一个参数，即 `req`，它是 `http` 模块的 `IncomingMessage` 接口的实现；函数的返回值是接口 `ResponseBody` 的实现，它的定义如下：

```typescript
interface ResponseBody {
    statusCode: number;
    statusMessage: string;
    header: { [name: string]: string; };
    data: string | Buffer | Readable;
}
```

要更为简化的定义 `statusMessage` 属性，可以使用本框架导出的 `HttpStatus` 对象来获取对应的默认消息，例如 `HttpStatus[200]` 的值是 `'Ok'` ， `HttpStatus[404]` 的值是 `'Not found'` 。

不过，这样的返回方式依然较为麻烦，因此框架中提供了一些快速生成状态为 `200` ，消息为 `Ok`，并在 `header` 中设置正确的 `"Content-Type"` 的 `ResponseBody`的函数。

这些函数，可以从 `resBuilders` 中获得，例如上面的案例，可以变化为：

```typescript
import { EntryPoint, resBuilders } from "anelsonia"

const entry: EntryPoint = (req) => {
    return resBuilders.text("hello, world\n")
}
```

要建立一个完整的服务，需要建立一个服务器，可以写成如下样式：

```typescript
import { createServer, EntryPoint, resBuilders } from "anelsonia"

const entry: EntryPoint = (req) => {
    return resBuilders.text("hello, world\n")
}

const server = createServer(entry)
server.listen(8080)
```

注意，`server` 实际上是一个标准的 `http` 模块的 `Server` 实例。

要更加细致的控制建立流程，你可以利用 `genBaseHandler` 将 `EntryPoint` 实例转化为 `RequestHandler` 实例，然后传入服务器：

```typescript
import { createServer } from "http"
import { genBaseHandler, EntryPoint, resBuilders } from "anelsonia"

const entry: EntryPoint = (req) => {
    return resBuilders.text("hello, world\n")
}

const httpHandler = genBaseHandler(entry)

const server = createServer(httpHandler)
server.listen(8080)
```

## 路由

使用 `router` 函数构建一个路由，使用路由返回的 `match` 函数和访问的路径做匹配，使用返回的`handleBy` 指定处理的对应函数。如果 `match` 未能成功匹配，会返回 `null` 。

```typescript
import { createServer, EntryPoint, resBuilder, router, RouteHandler } from "anelsonia";
import { errorHandler } from "./errorHandler";
import { fileHandler } from "./fileHandler";
import { helloHandler } from "./helloHandler";

const helloRoute = router("/hello/:username");
const fileRouter = router("/public/(.*)");
const errorTest = router("/error/:errCode");

const entry: EntryPoint = async (req) => {
    const url = req.url ?? "/";
    return await helloRoute.match(url)?.handleBy((pathParams, searchParams) => helloHandler(pathParams, searchParams, req))
        || fileRouter.match(url)?.handleBy(fileHandler)
        || errorTest.match(url)?.handleBy(errorHandler)
        || resBuilder.httpError(404);
};

createServer(entry).listen(8080);
```

因为使用了和Express一样的 `path-to-regexp` 库，因此可以使用完全一样的方式构建路由。

`pathParams` 参数是路由参数，它是一个 `Map` 对象，使用 `get` 方法从其中获取值（字符串），利用 `forEach` 遍历键值对， `searchParams` 是查询参数，它是一个 `URLSearchParams` 实现，它和 `Map` 对象的用法基本一致。

路由控制器并不一定要返回一个 `ResponseBody` 的实现，也可以返回任意值作为一个处理过程的中间量。

路由控制器 `RouteHandler` 并非只能接受路径参数和查询参数，但是 `handleBy` 只会传递给它两个参数。可以根据需要传入其他参数，例如要将 `req` 对象传递给路由时，你可以将 `handleBy` 写成：`xRouter.match(url).handleBy((p,q) => handler(p, q, req))`，`handler`的定义为：`const handler: RouteHandler = (params, querys, req) => {}`，如上面的 `helloHandler` 那样。下面是 `helloHandler` 的定义形式：

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

特别需要注意的是，路由控制器和入口函数都可以是异步函数，且特别建议将入口函数设置为异步函数，以使用 `await` 处理后续的异步动作；于此同时，需要注意 `Promise<null>` 在使用 `||` 进行向后传递时，会被视为 `true` 的结果，因此必须 `await` 。

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

注意，因为处理流时对于出错的情况，我是瞎几把处理的（其实就是没处理），不管是手动实现 `ResponseBody` 还是使用我的 `stream` 和 `file` 函数都一样。所以使用前请务必小心并多加测试，如果可以的话请教教我该怎么改……

## 其他

等我有空了改改变量名。

路由是不是应该限制一下请求方法。
