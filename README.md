# Anelsonia2

Anelsonia2是一个Web服务工具组。它包含：

1. 核心组件：`shim`函数，将入口函数转换成`http`，`https`或`http2`模块可以使用的请求监听器。
2. 路由组件：用于创建路由和响应路由的函数
3. 响应组件：快速构建响应体的工具
4. 工具组件：目前包含了一个可以根据HTTP状态码查询对映状态消息的对象

## 快速开始

### 安装

```bash
npm install anelsonia2
```

### 创建入口

需要使用`shim`来将入口函数`EntryPoint`转换为`createServer`或`createSecureServer`的处理器函数的函数，这个函数在`anelsonia2/core`中。

```typescript
import { shim } from "anelsonia2/core"
import { createServer } from "http"
import { createSecureServer } from "http2"

const reqHandler = shim(async req => {
    return {
        statusCode: 200, statusMessage: "Ok", body: "nice to meet you",
        headers: {"content-type": "text/plain"}
    }
})

createServer(reqHandler).listen(8080)
createServer(http2Options, reqHandler).listen(8081)
```

> 这里对HTTP/2的支持是不完整的，无法自行操作整个会话的Socket，要充分使用HTTP/2的功能，应该直接使用`http2`模块进行编程而不是使用`anelsonia2`来处理请求，但路由、响应构建工具仍然可以单独使用。

### 响应工具

上面我们已经构建了一个会返回`nice to meet you`消息的服务器了，但是手动构建一个返回对象是麻烦的，所以我们使用工具组提供的响应工具来构建它。

```typescript
import { Response } from "anelsonia2/response"

const reqHandler = shim(async req => {
    return new Response()
        .setBody("nice to meet you")
        .setHeaders({"content-type": "text/plain"})
})
```

这样，状态码和状态消息都自动设置了。

响应工具是一个名为`Response`的类。

提供了四个`getter`来返回对应的值，它们实现了入口函数需要返回的`ResponseProps`：

- statusCode: 有效的Http状态码
- statusMessage: 字符串类型的状态消息
- body: 字符串或Buffer或可读流的响应主体
- setHeaders: 响应头

它的构造函数没有参数，但提供四个方法来设置上述四项属性，他们的参数和属性的类型一致：

- setStatusCode: 设置状态码
- setStatusMessage: 设置状态消息
- setBody: 设置响应主体
- setHeaders: 设置响应头

需要注意的事情有：

1. 除了`setHeaders`，对已有的`Response`对象使用设置方法，会替换掉对象内已有的属性，而`setHeaders`会合并属性
2. `setHeaders`可以接受多个参数，他们会被合并，后面的参数具有更高的优先级
3. 未设置状态码时和响应主体时，默认的状态码是404，设置了响应主体后，默认的状态码是200
4. 未设置状态消息时，它的值会从状态码中推断出来。
5. 未设置响应主体时，它的值和状态消息相同，响应头会被加入`{"content-type": "text/plain"}`。

### 路由

#### 创建路由

对于访问不同路径的访问，应该予以不同的响应，此时需要使用到路由。路由在HTTP请求中有三个主要的要素，分别是要匹配的路径模式、对应的处理器函数、客户端访问的路径，当客户端访问的路径与要匹配的路径模式相符合时，应该调用对应的处理器函数，返回正确的结果。

这个结果可以是一个响应对象，也可以是其他的东西。例如，我们可以使用`createRouter<P, T>`创建一个返回字符串的路由。其中，`P`扩展自`string`类型，是待匹配的路径模式，`T`是处理函数的返回类型。

```typescript
import { createRouter } from "anelsonia2/router"
export const helloRt = createRouter("^/hello/(?<yourname>.*)", (matched) => {
    return matched.yourname
})
```

将他加入到入口函数中：

```typescript
const reqHandler = shim(async req => {
    const reqUrl = req.url ?? "/"
    const message = helloRt(reqUrl) ?? "nice to meet you"
    return new Response()
        .setBody(message)
        .setHeaders({"content-type": "text/plain"})
})
```

路由中有以下几件事情值得注意：

1. 创建路由的时候使用的字符串实际上是一个命名的正则表达式，也只有被命名的捕获会被作为参数提交给路由处理器。
2. 路由处理器的参数实际上是正则表达匹配后的`groups`对象，但是已经推导出了正确的类型。
3. 创建路由返回的是一个函数，它的参数是字符串，返回值为`null`（路径不匹配）或处理器的返回值（路径匹配）。

#### 路由聚合

一个路由只能对一个路径进行匹配，这显然是不够的。根据路由返回值的特性，我们可以使用`??`运算符将多个平级路由聚合起来，像这样：

```typescript
const response = firstRt(url) ?? 
    secondRt(url) ??
    thirdRt(url) ??
    new Response().setStatusCode(404)
```

但是这样重复了多次相同的`url`参数，是不好的，因此路由中提供了`createHub<T>`函数用于处理这个问题：

```typescript
const hub = createHub(firstRt, secondRt, thirdRt)
const response = hub(url) ?? new Response().setStatusCode(404)
```

`createHub<T>`函数能将多个路由聚合在一起，形成一个新的路由，它会依次对传入的路由进行匹配，返回第一个成功匹配的结果。得到的聚合路由的匹配成功的返回类型取决于传入的路由的返回类型，传入的所有路由返回类型应该是一致的，如果一定要不一致，需要显式的使用联合类型进行泛型实例化。

#### 扩展型路由

最终直接参与路径匹配的路由函数在路由组件中的定义是这样的：

```typescript
export type Router<T> = (url: string) => T | null;
```

可以注意到，用于参与匹配的字符串是其唯一参数，相应的，绑定在其上的路由处理器也只能使用路由解析的结果这一唯一的参数。但实际应用中，不可能仅仅依靠路径来作为参数。因此，设计了扩展型半路由，它的定义如下：

```typescript
export type HalfExtendRouter<T, X> = (extraArgs: X) => Router<T>;
```

它接收一个额外的参数，返回一个路由函数。我们可以使用`createHalfExtendRouter<P, T, X>`来创建它。该函数的前两个泛型参数和`createRouter<P, T>`是一样的，最后一个泛型类型`X`是额外参数的类型，即路由处理器函数的第二个参数的类型，在声明匿名的处理器函数的时候，这个参数的类型需要显示声明。

例如，我们创建一个从请求主体中获得内容的路由：

```typescript
import rawBody from "raw-body"
import { FreesiaRequest } from "anelsonia2/core"
import { createHalfExtendRouter } from "anelsonia2/router"

// FreesiaRequest是入口函数的req参数的类型。
const receiveMsgRt = createHalfExtendRouter(
    "^/api/(?<username>.*)", async (matched, req: FreesiaRequest) => {
        try {
            const message = (await rawBody(req)).toString()
            const response = {
                username: matched.username,
                received: message
            }
            return new Response()
                .setBody(JSON.stringify(response))
                .setHeaders({"content-type": "application/json"})
        } catch(err) {
            logError(err)
            return new Response().setStatusCode(500)
        }
    }
)
```

将其放到请求入口中：

```typescript
const reqHandler = shim(async req => {
    const reqUrl = req.url ?? "/"
    const router = createHub(
        helloRt, receiveMsgRt(req)
    )
    return router(reqUrl) ?? new Response().setStatusCode(404)
})
```

如果有多个使用相同的额外参数的半路由，可以使用`createExtendRtHub<T,X>`函数来统一进行参数接收，像这样：

```typescript
const reqHandler = shim(async req => {
    const reqUrl = req.url ?? "/"
    const routerNeedReq = createExtendRtHub(req, extRt1, extRt2, extRt3)
    const router = createHub(
        helloRt, routerNeedReq
    )
    return router(reqUrl) ?? new Response().setStatusCode(404)
})
```

该函数的第一个参数是需要的额外参数，后面的参数是要参与匹配的平级扩展半路由。

> 为什么不能直接`createExtendRouter(pathname, handler, extraArgs)`？
>
> 这种方式在Anelsonia的v1版本中使用过，但是存在一个严重的问题：路由的创建可能是在`extraArgs`的作用域外进行的，例如要使用`req`作为参数时，如果使用这样的写法，那么必须在入口函数内创建路由，而`handler`又常常和路由一同创建（分开创建会变得麻烦），这样的写法是不好的。

#### 条件匹配

有时候，处理过程中会出现以字符串为形式的标识符，对不同的标识符会进入不同的路由处理器。此时没有必要大动干戈使用`createRouter`，而可以使用路由模块导出的`condition`函数，像这样：

```typescript
const lowerCaseName = "firefox"
const fullBrowserName = condition(lowerCaseName)
    .match("firefox", (cond) => "Mozilla Firefox")
    .match("safari", (cond) => "Apple Safari")
    .match("chrome", (cond) => "Google Chrome")
    .match("edge", (cond) => "Microsoft Edge")
    .getResult()
```

`condition`有一个参数`reality`，为字符串格式，是待匹配的标志。其返回的对象含有`match`和`getResult`方法，`match`方法用于提供可能的情形和对应的回调函数，情形（`condition`）为字符串参数，回调函数有一个参数，是输入的`condition`的值。

若多次调用`match`方法匹配同一个情形，最终`getResult`的结果取最后一次的回调函数的结果。

### 工具组件

#### Http状态码

查询状态码对应的状态消息，是`Response`推断未设置的类型消息，限制statusCode范围的依据的依据。一般应该用不着。
