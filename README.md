# Anelsonia2

Anelsonia2是一个Web服务工具组。它包含：

1. 核心组件：`shim`函数，将入口函数转换成`http`，`https`或`http2`模块可以使用的请求监听器。
2. 路由组件：用于创建路由和响应路由的函数
3. 响应组件：快速构建响应体的工具
4. 工具组件：目前包含了一个可以根据HTTP状态码查询对映状态消息的对象

> API Doc: https://qihexiang.github.io/anelsonia

## 快速开始

### 安装

```bash
npm install anelsonia2
```

### 创建入口

需要使用`shim`来将入口函数`EntryPoint`转换为`createServer`或`createSecureServer`的处理器函数的函数，这个函数在`anelsonia2/core`中。

```typescript
import { shim } from "anelsonia2"
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

#### Respond类

```typescript
import { shim, Respond } from "anelsonia2"

const reqHandler = shim(async req => {
    return new Responsd()
        .setBody("nice to meet you")
        .setHeaders({"content-type": "text/plain"})
})
```

这样，状态码和状态消息都自动设置了。

响应工具是一个名为`Respond`的类。

提供了四个`getter`来返回对应的值，它们实现了入口函数需要返回的`ResponseProps`：

- statusCode: 有效的HTTP状态码
- statusMessage: 字符串类型的状态消息
- body: 字符串或Buffer或可读流的响应主体
- setHeaders: 响应头

它的构造函数没有参数，但提供四个方法来设置上述四项属性，他们的参数和属性的类型一致：

- setStatusCode: 设置状态码
- setStatusMessage: 设置状态消息
- setBody: 设置响应主体
- setHeaders: 设置响应头

需要注意的事情有：

1. 除了`setHeaders`，对已有的`Respond`对象使用设置方法，会替换掉对象内已有的属性，而`setHeaders`会合并属性
2. `setHeaders`可以接受多个参数，他们会被合并，后面的参数具有更高的优先级
3. 未设置状态码时和响应主体时，默认的状态码是404，设置了响应主体后，默认的状态码是200
4. 未设置状态消息时，它的值会从状态码中推断出来。
5. 未设置响应主体时，它的值和状态消息相同，响应头会被加入`{"content-type": "text/plain"}`。

#### Respond::create和createRes

当然，更多的时候我们希望用一个函数就能够构建好`ResponseProps`，此处也提供了对`Respond`类的额外创建方法：`Respond.create()`函数，它也使用`createRes`的名称导出，且是`anelsonia2/core/response`的默认导出。该函数提供了7个重载，请参见API文档中的相关内容：<https://qihexiang.github.io/anelsonia/classes/Respond.html#create>

该函数提供的多种重载能让人较为舒适地创建`Respond`。

> API文档无法自动地为createRes转发函数注释文档，但是在IDE中一般会正常显示。

例子：

```js
import { createRes } from "anelsonia2"

createRes() // 404 response
createRes("hello, world") // response body
createRes(500) // status code
create(302, "/login") // status code and body
create(200, {"Server": "anelsonia2"}) // status code and headers
create("hello, world", {"Content-Type": "text/plain charset=UTF-8"}) // body and headers
createRes(206, partialStream, headers) // status code, body and headers
```

### 路由

由于函数式的设计，这个库并不包含像express那样的`app.get(pattern, handler)`风格的路由，而是通过工具函数来实现请求路径的区分的。

#### 路由（Route）

路由在Anelsonia中的概念是，当用户访问的路径符合某一个规则的时候，则执行对应的函数，并获得函数的返回值。要创建一个路由，使用`createRoute`函数来实现。

`createRoute`中可以传入两个参数，第一个是路由匹配模式`pattern`，格式像这样：`/user/<username>/<age>/`，这样，就可以匹配到类似于`/user/freesia/16/`这样的路径。

表明路径参数的形式有三种：

- `<T>`：非贪婪模式，匹配任意字符出现至少一次。
- `<[T]>`：贪婪模式，匹配任意字符至少出现一次。
- `[T]`：贪婪模式，匹配任意字符，也可以没有字符。

可以观看这个例子中，对`filepath`的捕获情况来理解：

|模式/路径|`/user/hx/docs/index.md`|`/user/hx/docs/index.md/`|`/user/hx/`|
|---|---|---|---|
|`/user/<name>/<filepath>/`|`null`|`null`|`null`|
|`/user/<name>/<filepath>`|`"docs/index.md"`|`"docs/index.md/"`|`null`|
|`/user/<name>/<[filepath]>/`|`null`|`"doc/index.md"`|`null`|
|`/user/<name>/[filepath]`|`"docs/index.md"`|`"docs/index.md/"`|`""`|

另一个参数自然是对应的函数`handler`，这个函数有2个参数，其一是根据`pattern`推导出的路由匹配参数`params`，例如上面的例子中，推导出的参数类型为`{name: string, filepath: string}`，所有的路由参数类型都是`string`，开发者应该根据实际的情况进行检查和类型转换。另一个参数是搜索参数`quries`，它的类型是`UrlSeachParams`，由于路由匹配并不检查搜索参数的合法性，因此并不进行类型标注，开发者在使用时应当注意到`quries.get`方法取回的值可能为`null`，这需要开发者自行谨慎处理。

下面是一个示例：

```js
import { createRoute } from "anelsonia2" 

const route = createRoute('/user/<username>/<filepath>', async ({username, filepath}, queries) 
    => JSON.stringify(await readDir(username, filepath)))
const result = await route(url)
```

#### 交换机（Switcher）

每个Route只是一条路径，实际上需要使用多条路径进行依次匹配。使用交换机（Switcher）实现该功能。例如有路由`route1`-`route6`，他们的`handler`拥有相同的返回类型，则可以聚合在一起。

> 返回类型不同的平级路由，使用联合类型作为Switcher的泛型类型。

方式如下：

```js
import { createSwitcher } from "anelsonia2"
const switcher = createSwitcher(route1, route2, route3, route4, route5, route6)
const result = switcher(url)
```

Switcher最终得到的函数和Route实际上是一样的，因此可以逐级将多个Switcher也聚合起来。

> 注意，由于`switcher`的实现使用了`??`运算符（判断匹配失败的依据是路由返回`null`），因此当你需要返回`null`或`undefined`时，必须将其包裹起来，例如`{ value: null }`。

#### 额外参数

在实际使用中，`handler`往往还需要其他参数的输入，你可以这样来获得额外参数：

```ts
import apiRouteHandler from "./controller/api"
import DB from "./data/IO"
const db = new DB();

function main(req: Request) {
    const result = await createRoute("/api/<options>", ({options}, queries) => apiRouteHandler(options, queries, {req, db}))(req.url)
    return result
}
```

但如果我们想将路径和控制器绑定之后再接收参数的话，就无法做到了。因此，本库中提供了额外的函数：`createExtendRoute`。它的使用与`createRoute`基本相同，差异在于它的`handler`可以接受一个额外的自定义类型参数；返回的路由匹配时也可以接收一个对应的参数。例如上面的例子会变成：

```ts
// controller/api.ts
export const apiRoute = createExtendRoute('/api/<options>', ({options}, queries, {req: Request, db: DB}) => {...})

// main.ts
import { apiRoute } from "./controller/api"
import DB from "./data/IO"
const db = new DB();

function main(req: Request) {
    const route = await apiRoute(req.url, {req, db})
    return result
}
```

若有多个这样的扩展路由进行聚合时，可以使用`createExtendSwitcher`来创建交换机。

#### 同时创建路由和交换机

利用`createRoute`和`createSwitcher`，我们可以在分离的多个地方对路由规则进行定义，但与此同时，也会有人更倾向与将路径匹配模式集中定义于一处，此时重复使用`createRoute`和`createSwitcher`就显得十分麻烦。Anelsonia提供了一个额外的函数`createSwRt`来实现这个功能，他提供一个链试调用来创建一个交换机及其对应的路由。

例子如下，有若干已经定义好的`handler`，其中一些返回是异步的（`Promise`）。

```js
import { createSwRt } from "anelsonia2"

async function main(req) {
    const { switcher } = createSwRt()
        .route("/user/<username>/<rest>", infoHandler)
        .route("/view/<rest>", viewHandler)
        .route("/d/<username>/<filepath>", downloadHandler)
        .route("/b/<username>/<[filepath]>/", browseHandler)
    const response = (await switcher(req.url)) ?? new Respond().setStatus(404)
    return response
}
```

每次链式调用中的`route`函数和`createRoute`函数参数类型一致，返回中解析出的`switcher`和`createSwitcher`的类型是一致的。

另外，提供了一个`createExtendSwRt`函数，使用方法基本一致。

#### 简单匹配（Condition）

上述的路由匹配模式只能支持URL的路径匹配，但实际上我们还会根据一些具体的情况，例如请求的方法、可枚举的具体路径参数等进行请求分流，这些情况一般需要精确匹配字符串。这使用上面的函数并不容易实现，或者显得更加麻烦，因此提供了一个`condition`函数，以链试调用的方式来实现类似与switch语法的功能，可以看作是一个带有返回值的switch块。

```js
import { condition } from "anelsonia2"

const { result } = condition(req.method)
    .match('GET', () => getSw(req.url))
    .match(['POST','PUT'], () => uploadSw(req.url, req))
    .match(/^(OPTION|TRACE)$/, (method) => debugSw(req.url, method))
```

例如，这个例子分流的依据是`req.method`，我们将`GET`请求分为一组，`POST`和`PUT`请求分为一组。调用链中，`match`的一个参数是字符串或字符串数组，当字符串和分流依据相等，或数组中存在匹配的字符串时，或给定的正则表达式与分流依据匹配时，会执行后续的`handler`，所有注册的`handler`应该有相同的返回类型或符合`condition<T>`描述的泛型。解构出的`result`是`handler`的返回值。

> 注意，由于此处做了变量解构，不能在`condition`前直接使用`await`来处理异步的`result`，你需要在之后使用`result`是写作`await result`。

### 工具组件

#### composeFn函数组合器

提供了一个用于组合函数的组合函数`composFn`。举例说明：

```ts
import { composeFn } from "anelsonia2";

const { fn } = composeFn((x: number) => x + 1)
    .next(x => Math.pow(x, 2))
    .next(x => `The final value is ${x}`);

console.log(fn(2)); // The final value is 9
```

执行的顺序是显而易见的，前一个函数的计算结果是后一个函数的入参。

你使用的IDE可能会提醒你，这个函数还有一个额外的重载，你可以在`composeFn`中填入两个参数：

```ts
import { composeFn } from "anelsonia2";

const { fn } = composeFn(x => Math.pow(x, 2), (x: number) => x + 1)
    .next(x => `The final value is ${x}`);

console.log(fn(2)); // The final value is 9
```

你可以注意到第二个函数需要类型标注而第一个并不需要，这是因为`composeFn`的第一个参数是第二个执行的函数，第二个参数是第一个执行的函数。这个怪异的设计是为了`composeFn`实现的简便设计的，这个重载也仅仅是为了内部使用，在一般情况下，你不应该使用它。

#### createWrapper生成包装器

Koa和Express等框架都提供了洋葱模型，它们在一些情景下非常有用，例如记录处理请求花费的时间。我也提供了一个类似的方式来包裹请求处理逻辑，这就是`createWrapper`函数。以时间记录和全局禁用`Keep-Alive`属性为例：

```ts
import { createWrapper } from "anelsonia2";

const timeMeasure = createWrapper<AnelsoniaReq, Date, AsyncResponse>(
    () => new Date(),
    async (start, res, req) => {
        console.log(`${start.toLocaleString()} ${req.method} ${req.url} ${(await res).statusCode} ${new Date().getTime() - start.getTime()}ms`);
        return res;
    }
);

const disableKeepAlive = createWrapper<AnelsoniaReq, void, AsyncResponse>(
    () => { },
    async (_, res) => {
        const response = await res;
        if (response instanceof Respond) response.setHeaders({ "Keep-Alive": "false" });
        else response.headers = { ...response.headers, "Keep-Alive": "false" };
        return response;
    }
);

createServer(
    shim(
        timeMeasure(
            disableKeepAlive(
                main
            )
        )
    )
).listen(8000)
```

最后这一段代码即对入口函数`main`的包裹。如果你的包裹器很多，你可以尝试使用`composeFn`来连接他们，来避免被苏联间谍偷走大量的右括号：

```ts
const { fn: wrapper } = composeFn(disableKeepAlive)
    .next(timeMeasure)
    // shim和createServer函数也可以一并放进来
    .next(shim)
    .next(createServer)

wrapper(main).listen(8000)
```

> 我应该使用`createWrapper`吗？
> 
> 在实践中，我们可能会发现，直接编写一个包裹函数的函数比使用createWrapper更加容易（不必填写复杂的泛型类型，不需要手动将前置操作的计算结果打包return）。对于一些特别简单、只使用一次的行为，直接将逻辑写入到要被包装的函数中也并无不可。
>
> createWrapper只是一个辅助工具，可以帮助开发者进行代码组织，他并不是实现包裹的唯一方式。
