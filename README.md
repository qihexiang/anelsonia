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
import { Respond } from "anelsonia2/response"

const reqHandler = shim(async req => {
    return new Responsd()
        .setBody("nice to meet you")
        .setHeaders({"content-type": "text/plain"})
})
```

这样，状态码和状态消息都自动设置了。

响应工具是一个名为`Respond`的类。

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

1. 除了`setHeaders`，对已有的`Respond`对象使用设置方法，会替换掉对象内已有的属性，而`setHeaders`会合并属性
2. `setHeaders`可以接受多个参数，他们会被合并，后面的参数具有更高的优先级
3. 未设置状态码时和响应主体时，默认的状态码是404，设置了响应主体后，默认的状态码是200
4. 未设置状态消息时，它的值会从状态码中推断出来。
5. 未设置响应主体时，它的值和状态消息相同，响应头会被加入`{"content-type": "text/plain"}`。

### 路由

由于函数式的设计，这个库并不包含像express那样的`app.get(pattern, handler)`风格的路由，而是通过工具函数来实现请求路径的区分的。

#### 路由（Route）

路由在Anelsonia中的概念是，当用户访问的路径符合某一个规则的时候，则执行对应的函数，并获得函数的返回值。要创建一个路由，使用`createRoute`函数来实现。

`createRoute`中可以传入两个参数，第一个是路由匹配模式`pattern`，格式像这样：`/user/<username>/<age>/`，这样，就可以匹配到类似于`/user/freesia/16/`这样的路径。具有未知层级的路径匹配时，位置的部分必须放在最后，下面是例子：

对于路径：`/user/qihexiang/freesia/documents/index.md/`

- `/user/<username>/<filepath>/` 不能匹配上。
- `/user/<username>/<filepath>` 能匹配上，`filepath`为`freesia/documents/index.md/`。
- `/user/<username/<[filepath]>/` 能匹配上，`filepath`为`freesia/documents/index.md`。

当带有中括号时，匹配模式是贪婪的。如果路径中不应该包含未知层级的路径匹配，最好将`pattern`设置为第一种形式以拒绝非法请求。

另一个参数自然是对应的函数`handler`，这个函数有2个参数，其一是根据`pattern`推导出的路由匹配参数`params`，例如上面的例子中，推导出的参数类型为`{username: string, age: string}`，所有的路由参数类型都是`string`，开发者应该根据实际的情况进行检查和类型转换。另一个参数是搜索参数`quries`，它的类型是`UrlSeachParams`，由于路由匹配并不检查搜索参数的合法性，因此并不进行类型标注，开发者在使用时应当注意到`quries.get`方法取回的值可能为`null`，这需要开发者自行谨慎处理。

下面是一个示例：

```js
const route = createRoute('/user/<username>/<filepath>', async ({username, filepath}, queries) 
    => JSON.stringify(await readDir(username, filepath)))
const result = await route(url)
```

#### 交换机（Switcher）

每个Route只是一条路径，实际上需要使用多条路径进行依次匹配。使用交换机（Switcher）实现该功能。例如有路由`route1`-`route6`，他们的`handler`拥有相同的返回类型，则可以聚合在一起。

> 返回类型不同的平级路由，使用联合类型作为Switcher的泛型类型。

方式如下：

```js
const switcher = createSwitcher(route1, route2, route3, route4, route5, route6)
const result = switcher(url)
```

Switcher最终得到的函数和Route实际上是一样的，因此可以逐级将多个Switcher也聚合起来。

#### 额外参数

在实际使用中，`handler`往往还需要其他参数的输入，你可以这样来获得额外参数：

```js
import apiRouteHandler from "./controller/api"
import DB from "./data/IO"
import respond from "anelsonia2/respond"
const db = new IO();

function main(req) {
    const result = await createRoute("/api/<options>", ({options}, queries) => apiRouteHandler(options, queries, {req, db}))
    return result
}
```

但如果我们想将路径和控制器绑定之后再接收参数的话，就无法做到了。因此，本库中提供了额外的函数：`createExtRoute`。它的使用与`createRoute`基本相同，差异在于它的`handler`可以接受一个额外的自定义类型参数；返回的路由匹配时也可以接收一个对应的参数。

若有多个这样的扩展路由进行聚合时，可以使用`createExtendSwitcher`来创建交换机。

#### 同时创建路由和交换机

利用`createRoute`和`createSwitcher`，我们可以在分离的多个地方对路由规则进行定义，但与此同时，也会有人更倾向与将路径匹配模式集中定义于一处，此时重复使用`createRoute`和`createSwitcher`就显得十分麻烦。Anelsonia提供了一个额外的函数`createSwRt`来实现这个功能，他提供一个链试调用来创建一个交换机及其对应的路由。

例子如下，有若干已经定义好的`handler`，其中一些返回是异步的（`Promise`）。

```js
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
const { result } = condition(req.method)
    .match('GET', () => getSw(req.url))
    .match(['POST','PUT'], () => uploadSw(req.url, req));
```

例如，这个例子分流的依据是`req.method`，我们将`GET`请求分为一组，`POST`和`PUT`请求分为一组。调用链中，`match`的一个参数是字符串或字符串数组，当字符串和分流依据相等，或数组中存在匹配的字符串时，或给定的正则表达式与分流依据匹配时，会执行后续的`handler`，所有注册的`handler`应该有相同的返回类型或符合`condition<T>`描述的泛型。解构出的`result`是`handler`的返回值。

> 注意，由于此处做了变量解构，不能在`condition`前直接使用`await`来处理异步的`result`，你需要在之后使用`result`是写作`await result`。

### 工具组件

#### Http状态码

查询状态码对应的状态消息，是`Respond`推断未设置的类型消息，限制statusCode范围的依据的依据。一般应该用不着。
