# Freesia

Freesia 是一个 Node.js 的 Web 服务器开发的 TypeScript 库。

## 安装

```sh
npm install freesia
npm install -D typescript @types/node
```

## response = f(request)

受到 React 中`UI = f(state)`的启发，Freesia 库的核心观念是`response = f(request)`。当你使用 Freesia 库时，整个开发工作将围绕构建`f`函数展开。

一个最简单的`hello, world`程序对于 Freesia 而言应该是这样：

```ts
import { createServer } from "http";
import { shimHTTP, createRes } from "freesia";
createServer(shimHTTP(async (req) => createRes("hello, world"))).listen(8000);
```

核心的逻辑是`async req => createRes("hello, world")`，接受一个 req 对象作为参数，返回一个 Response 对象，正如 React 中传入 props 而返回 JSX 一样。

## 响应

从最基础的 HTTP 传输而言，响应内容值得关心的一般分为 3 个部分：状态码、响应头和响应主体。一些情况下，可能出现自定义状态消息的需求。对于 Freesia 的主函数而言，它应该返回一个符合`ResponseProps`定义的对象（或者`Promise<ResponseProps>`），它应该包含上述四种内容。例如：

```ts
const response = {
    statusCode: 200, // 一切有效的HTTP状态码
    statusMessage: "Ok", // 状态消息对HTTP/2是无效的，现代客户端有时也并不接受自定义状态消息
    body: "hello, world", // body可以是一个字符串，Buffer或者可读的Node.js流
    headers: { "Content-Type": "text/plain; charset=UTF-8" }, // headers的key是string，value是string|string[]|number
};
```

除去手动声明之外，Freesia 还提供了一个`Respond`类来帮助创建响应对象。

### Respond 类

创建`Respond`对象的方法有如下三种：

```ts
import { Respond, createRes } from "freesia";
// new Respond
new Respond()
    .setBody("hello, world")
    .setHeaders(["Content-Type", "text/plain; charset=UTF-8"])
    .setHeaders(["Content-Length", 12]);
Respond.create("hello, world", {
    "Content-Type": "text/plain; charset=UTF-8",
    "Content-Length": 12,
});
createRes("hello, world", {
    "Content-Type": "text/plain; charset=UTF-8",
    "Content-Length": 12,
});
```

其中，`createRes`是`Respond.create`的别名，这两个方法比`new Respond()`更加简便，提供了多种重载用于一次性建立一个响应对象，参考[API 文档](https://qihexiang.github.io/freesia/classes/Respond.html#create)。

`Respond`对象包含如下方法：

-   setStatusCode
-   setStatusMessage
-   setBody
-   setHeaders

用于设置对象对应的属性，其中前三种方法每次调用会替代掉前一次调用的结果，而`setHeaders`方法则会在每次调用时将新的响应头合并到之间的结果中，例如上面调用中的两次`setHeaders`设置的响应头都是有效的。此外，setHeaders 还支持多种格式的输入，请参考[API 文档](https://qihexiang.github.io/freesia/classes/Respond.html#setHeaders)。

Freesia 提供了一些函数来配合`setHeaders`方法的使用，例如：

```ts
const message = "hello, world\n";
const response = createRes(200, message).setHeaders(
    contentType("txt", "UTF-8"),
    contentLength(message),
    contentDisposition(true, "helloWorld.txt")
);
```

## 路由

由于函数式的设计，这个库并不包含像 express 那样的`app.get(pattern, handler)`风格的路由，而是通过工具函数来实现请求路径的区分的。

### 路由（Route）

路由在 Freesia 中的概念是，当用户访问的路径符合某一个规则的时候，则执行对应的函数，并获得函数的返回值。要创建一个路由，使用`createRoute`函数来实现。

`createRoute`中可以传入两个参数，第一个是路由匹配模式`pattern`，格式像这样：`/user/<username>/<age>/`，这样，就可以匹配到类似于`/user/freesia/16/`这样的路径。

表明路径参数的形式有三种：

-   `<T>`：非贪婪模式，匹配任意字符出现至少一次。
-   `<[T]>`：贪婪模式，匹配任意字符至少出现一次。
-   `[T]`：贪婪模式，匹配任意字符，也可以没有字符。

可以观看这个例子中，对`filepath`的捕获情况来理解：

| 模式/路径                    | `/user/hx/docs/index.md` | `/user/hx/docs/index.md/` | `/user/hx/` |
| ---------------------------- | ------------------------ | ------------------------- | ----------- |
| `/user/<name>/<filepath>/`   | `null`                   | `null`                    | `null`      |
| `/user/<name>/<filepath>`    | `"docs/index.md"`        | `"docs/index.md/"`        | `null`      |
| `/user/<name>/<[filepath]>/` | `null`                   | `"doc/index.md"`          | `null`      |
| `/user/<name>/[filepath]`    | `"docs/index.md"`        | `"docs/index.md/"`        | `""`        |

另一个参数自然是对应的函数`handler`，这个函数的参数是根据`pattern`推导出的路由匹配参数`params`，例如上面的例子中，推导出的参数类型为`{name: string, filepath: string}`，所有的路由参数类型都是`string`，开发者应该根据实际的情况进行检查和类型转换。

下面是一个示例：

```js
import { createRoute } from "freesia"

const route = createRoute('/user/<username>/<filepath>', async ({username, filepath})
    => JSON.stringify(await readDir(username, filepath)))
const result = await route(url)
```

### 交换机（Switcher）

每个 Route 只是一条路径，实际上需要使用多条路径进行依次匹配。使用交换机（Switcher）实现该功能。例如有路由`route1`-`route6`，他们的`handler`拥有相同的返回类型，则可以聚合在一起。

> 返回类型不同的平级路由，使用联合类型作为 Switcher 的泛型类型。

方式如下：

```js
import { createSwitcher } from "freesia";
const switcher = createSwitcher(route1, route2, route3, route4, route5, route6);
const result = switcher(url);
```

Switcher 最终得到的函数和 Route 实际上是一样的，因此可以逐级将多个 Switcher 也聚合起来。

> 注意，由于`switcher`的实现使用了`??`运算符（判断匹配失败的依据是路由返回`null`），因此当你需要返回`null`或`undefined`时，必须将其包裹起来，例如`{ value: null }`。
>
> 这个问题在你有多个可以匹配同一个路径的模式时尤为重要，例如下列两种模式：
>
> -   `/api/user/avatar`
> -   `/api/user/<otherInfo>`
>
> 都可以匹配到`/api/user/avatar`，如果第一个路由都返回`undefined`，则这两个路由回调都会被执行，尽管返回值是`undefined`，但函数中的副作用依然会发生。

### 额外参数

在实际使用中，`handler`往往还需要其他参数的输入，你可以这样来获得额外参数：

```ts
import apiRouteHandler from "./controller/api";
import DB from "./data/IO";
const db = new DB();

function main(req: Request) {
    const result = await createRoute("/api/<options>", ({ options }) =>
        apiRouteHandler(options, { req, db })
    )(req.url);
    return result;
}
```

但如果我们想将路径和控制器绑定之后再接收参数的话，就无法做到了。因此，本库中提供了额外的函数：`createRouteX`。它的使用与`createRoute`基本相同，差异在于它的`handler`可以接受一个额外的自定义类型参数；返回的路由匹配时也可以接收一个对应的参数。例如上面的例子会变成：

```ts
// controller/api.ts
export const apiRoute = createRouteX('/api/<options>', ({options}, {req: Request, db: DB}) => {...})

// main.ts
import { apiRoute } from "./controller/api"
import DB from "./data/IO"
const db = new DB();

function main(req: Request) {
    const route = await apiRoute(req.url, {req, db})
    return result
}
```

若有多个这样的扩展路由进行聚合时，可以使用`createSwitcherX`来创建交换机。

#### 同时创建路由和交换机

利用`createRoute`和`createSwitcher`，我们可以在分离的多个地方对路由规则进行定义，但与此同时，也会有人更倾向与将路径匹配模式集中定义于一处，此时重复使用`createRoute`和`createSwitcher`就显得十分麻烦。Freesia 提供了一个额外的函数`createSwRt`来实现这个功能，他提供一个链试调用来创建一个交换机及其对应的路由。

例子如下，有若干已经定义好的`handler`，它们返回的值类型相互匹配（例如`Promise<ResponseProps>`）。

```js
import { createSwRt } from "freesia";

async function main(req) {
    const { switcher } = createSwRt()
        .route("/user/<username>/<rest>", infoHandler)
        .route("/view/<rest>", viewHandler)
        .route("/d/<username>/<filepath>", downloadHandler)
        .route("/b/<username>/<[filepath]>/", browseHandler)
        .fallback(async (url) => createRes(404, `No route matched ${url}`));
    return switcher(url);
}
```

`route`和`fallback`函数会检查`handler`的返回类型是否一致，一致性的依据是第一个被调用的`route`方法的传入参数，如果要手动指定返回类型，例如有的`handler`返回异步结果，有的返回同步结果，则应该在第一次调用`route`时明确泛型类型，`.route<Promise<ResponseProps>>|ResponseProps>`。后续的`route`函数和第一个`route`并不是同一个函数，他们没有泛型参数。

> 自 0.8.20 版本起，你可以使用`createSwRt.route`来代替`createSwRt().route`，`createSwRt`保留后者仅为了和之前版本的代码兼容。

> 请务必不要通过导出`createSwRt`的执行结果来在多个文件中注册路由：  
> 第一次返回的`route`方法实际上会返回一个全新的对象，多次调用并不能将多个路由注册到一个交换机上，而是产生多个交换机；  
> 之后的`route`方法可以在多处调用并注册路由到同一个交换机，但是注册的顺序取决于模块导入导出的逻辑，这会使得路由顺序和你设想的不一致；  
> `fallback`方法并不会更新闭包，除非你使用它的返回值，否则这个注册是无效的。

每次链式调用中的`route`函数和`createRoute`函数参数类型一致，返回中解析出的`switcher`和`createSwitcher`的类型是一致的。

另外，提供了一个`createSwRtX`函数，来创建接受额外参数的路由和交换机，使用方法基本一致。

### 方法限制

上面介绍的路由并不对请求的请求方法进行检查，而在`handler`内部检查有时会变的麻烦，因此提供了`allowMethods`函数来解决这个问题（对于扩展路由，使用`allowMethodsX`代替）。

```ts
// 这个路由仅对GET方法有效，其他方法请求会返回null
const rt = createRoute(
    "/hello/<username>/",
    allowMethods(helloWorldHandler, ["GET"])
);
```

`allowMethods`的地一个参数是原始的路由处理器，第二个参数是一个数组，将允许的请求方法放入其中。他将原始处理函数包装成一个可能返回 null 的形式。

此外，提供了该函数的封装：

-   All 允许所有方法
-   Get 允许 GET 方法
-   Head 允许 HEAD 方法
-   Post 允许 POST 方法
-   ...
-   命名的特征是方法名称的大写首字母形式
-   对于扩展路由，在末尾加上 X

### 简单匹配（Condition）

上述的路由匹配模式只能支持 URL 的路径匹配，但实际上我们还会根据一些具体的情况，例如请求的方法、可枚举的具体路径参数等进行请求分流，这些情况一般需要精确匹配字符串。这使用上面的函数并不容易实现，或者显得更加麻烦，因此提供了一个`condition`函数，以链试调用的方式来实现类似与 switch 语法的功能，可以看作是一个带有返回值的 switch 块。

```js
import { condition } from "freesia";

const result = condition(req.method)
    .match("GET", () => getSw(req.url))
    .match(["POST", "PUT"], () => uploadSw(req.url, req))
    .match(/^(OPTION|TRACE)$/, (method) => debugSw(req.url, method))
    .getValue();
```

例如，这个例子分流的依据是`req.method`，我们将`GET`请求分为一组，`POST`和`PUT`请求分为一组。调用链中，`match`的一个参数是字符串或字符串数组，当字符串和分流依据相等，或数组中存在匹配的字符串时，或给定的正则表达式与分流依据匹配时，会执行后续的`handler`，所有注册的`handler`应该有相同的返回类型或符合`condition<T>`描述的泛型。解构出的`result`是`handler`的返回值。

获得返回值有两种方法：`getValue`和`withDefault`，后者接受一个回调函数，来根据输入的值返回一个值。

## 魔法函数

魔法函数是一组依靠 Node.js 的`async_hooks`模块实现的函数，它们可以让你在调用链上的任意函数中获得之前过程中的到的值，而不必经过参数传递。

### useRequest

当一个请求进入时，Node.js 会调用我们编写的主函数来处理这个请求，主函数可以接受到调用时传入的`req`参数。但有时我们会在一个极深的调用中使用他，例如：

main（接受到`req`参数） -> fileOperateSwitcher -> uploadHandler -> privillegeChecker -> securityChecker -> uploadService（真正使用`req`的地方）

在这个调用中，如果没有`useRequest`函数，我们需要在每个函数中都传第一次`req`参数，这是非常麻烦的。使用`useRequest`函数，我们可以不传递`req`，而是直接在`uploadService`中使用：

```ts
const req = useRequest();
```

需要注意的是，`req`作为一个流在调用链上不能被接收两次，例如你使用`getRawBody`在`securityChecker`中完全接收之后，就不能再在`uploadService`中接收它了。

### useURL

`useURL`函数可以在`shimHTTP`的回调函数的任意层次调用中获得这个请求的路径信息，使用方法为：

```ts
useURL(); // 返回host（主机名）、path（访问路径）、query（搜索参数的searchParams），method（请求方法）
useURL("method"); // 返回方法
useURL("host"); // 返回host
useURL("path"); // 返回path
useURL("query"); // 返回query
useURL(router); // Route<T>的路由，返回路由匹配结果。
```

### createFlare

除了在调用链上使用`req`或`url`信息，你还可以传递在调用过程中产生的任何值，使用`createFlare`函数来做到。

Freesia 提供了类似 React 上下文的功能（和请求绑定）。用`createFlare`函数来创建闪光弹，

它可以接受 0 或 1 个参数，若有参数，是一个对象，包含两项属性：

-   `mutable`：若为`true`，则观测得到的值不是只读的，如果你要使用闪光弹传递一个需要变化的 ORM 对象，它应该设置为 true；
-   `reassign`：若为`true`，可以多次使用 light 函数重新给闪光弹赋值，一般没有理由这么做。
-   不输入参数时，上述属性默认为`false`

它返回三个函数：

-   `assign`：赋值到 flare，这个函数调用之后，要被传递的值就可以通过`observe`函数访问了；
-   `observe`：观测 flare，执行这个函数可以得到要传递的值，它必须在`assign`函数之后调用；
-   `drop`：舍弃 flare，执行这个函数之后，`observe`将不能再被使用

> 这三个函数是通过数组返回的，你可以给他们取任意需要的名字。

```ts
// 调用次序为：main -> fileRoute -> uploadRoute -> uploadHandler -> uploadService
// 我们不想逐层传递request对像来获得上传的body，我们在main函数获得body后，将其用
// main.ts
export const [assign, observe, drop] = createFlare<Buffer>()

const main = async req => {
    const body = await getRawBody(req);
    assign(body); // 从此向下的调用可以通过observe函数访问body
    ...
    const res = fileRoute(); // 不需要传递body
    ...
    drop(); // 从此向下的调用不能再通过observe访问body
    return res
}

// service/fileUpload.ts
import {observe} from "../main";
import {writeFile} from "fs/promises";

export const uploadService = (filepath: string) => {
    const body = observe(); // 获得body
    return writeFile(filepath, body)
}
```

> 需要注意的以下几点：
>
> -   `createFlare`是完全独立的函数，可以在任何时机执行，但它返回的三个函数都只能在`main`的直接或间接调用中执行，否则会抛出错误
> -   静态分析时`assign`，`observe`和`drop`并不能判断要获取的值是否处于有效期，因此这三个函数会在不符合执行条件的情况下抛出错误。（而不是返回`undefined`或`null`）。你应该尽量避免在`if`分支中使用`assign`，正确的做法是`assign`一个可能为空的值，在使用时判断类型。
> -   `drop`函数不是必须执行的，`createFlare`内部使用的是`WeakMap`实现的，不必担心内存溢出的问题。

## 包装器

开发者可能会希望在一个函数执行前后分别执行一些代码，这些代码可能是可服复用的，也有可能只是希望这些逻辑被排除在核心逻辑之外，出于这样的需求，Freesia 提供了两个包装器创建函数：`createEffect`和`createWrapper`。

### 副作用包装

如果我们的包装逻辑并不修改原始函数的输入输出，可以使用副作用包装器`createEffect`。例如，要测量响应逻辑耗时：

```ts
const main = async (req: HttpReq) => createRes();
const timeMeasure = createEffect<typeof main>((req) => {
    const start = new Date();
    return (res) => {
        console.log(`Use ${new Date().getTime() - start.getTime()}ms`);
    };
});
export const mainWithTimeMeasure = timeMeasure(main);
```

我们会注意到，其实这个例子中的副作用和函数本身是无关的，对于这样的副作用我们可以使用`createEffect4Any`来创建，并且用到任何类型的函数上，例如：

```ts
const timeMeasure = createEffect4Any(() => {
    const start = new Date();
    return () => {
        console.log(`Use ${new Date().getTime() - start.getTime()}ms`);
    };
});

const fibbonnaci = (index: number): number =>
    !Number.isInteger(index) || index < 0
        ? 0
        : index === 0 || index === 1
        ? 1
        : fibbonnaci(index - 2) + fibbonnaci(index - 1);
const getBuffer = (origin: string) => Buffer.from(origin);
export const fibbonnaciWithTime = timeMeasure(fibbonnaci); // number => number
export const getBufferWithTime = timeMeasure(getBuffer); // string => Buffer
```

包裹后的函数依然保持了原有的入参和返回类型。

### 函数包装

另一种情况下，我们可能会使用外部逻辑修改原始函数的输入输出，甚至改变参数的输入类型，例如：

```ts
const main = async (req: HttpReq, body: Buffer) => createRes();
const bodyParser = createWrapper<(req: HttpReq) => AsyncResponse, typeof main>(
    async (req) => {
        const body = await rawBody(req);
        return [
            [req, body],
            (res) => {
                res.setHeaders(["Keep-Alive", "timeout=10"]);
                return res;
            },
        ];
    }
);
export const withBodyParser = bodyParser(main);
```

## 函数工具

### baseCompose 和 composeFn

`baseCompose`可以将两个函数连接起来，例如：

```ts
const fn = baseCompose(
    (x: number) => x + 1,
    (x) => Math.pow(x, 2)
);
fn(1); // 返回值为4
```

`composeFn`可以连接更多的函数：

```ts
const { fn } = composeFn((x: number) => x + 1)
    .next((x) => Math.pow(x, 2))
    .next(fibbonnaci);
```

### compute 和 computeLazy

#### Computation

使用`compute`创建`Computation<T>`对象。

```ts
const credentialInfo = compute(tokenBuf /** Buffer */)
    .map((buf) => buf.toString("utf-8"))
    .map(parseToken) // parseToken 是一个异步函数
    .aMapSkipNull((token) => (outDated(token) ? null : token))
    .aMapSkipNull((token) => token.username).value; // -> Promise<string | null>
```

它包含 4 种链式调用方法：

-   map：将一个函数应用于内部的值
-   mapSkipNull：将一个函数应用于内部的值，但如果原始值为 null 或 undefined，保持原始值
-   aMap：将一个函数应用于内部的值，若原始值是 Promise 包裹的，函数在对象的 then 中调用；函数的返回值总是被 Promise 包裹的
-   aMapSkipNull：将一个函数应用于内部的值，若原始值为`undefined|null|Promise<undefined|null>`，则保持原始值并用 Promise 包裹

所有四个方法都会返回一个新的`Computation`对象，如果你将这个对象分发到多处，进入不同的链中，会得到互不影响的多个结果。

#### Lazy

使用`computeLazy`创建`Lazy<T>`对象，它包含的链式方法和`Computation`完全一致。

区别在于，`Computation`在每次链式调用时进行计算，而`Lazy`仅仅组合函数。当你访问一个`Lazy`对象的`value`属性时，才会将初始值带入组合好的函数进行计算。需要注意的是，每次访问`value`都会进行计算，如果函数中包含副作用，你应该将`value`的值取出使用。

同样的，每次进行链式调用都会返回新的`Lazy`对象，当分叉前注册的函数都是纯函数时，进入不同链的计算结果互不干扰。
