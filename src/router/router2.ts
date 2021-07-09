/**
 * Create a class style root, using match method add route regexp and callback function.
 */
export class Route2<T> {
    readonly url: string;
    readonly fallback: T | null;
    private result: RegExpExecArray | null = null;
    private callback: ((result: RegExpExecArray) => T) | null = null;
    /**
     * 
     * @param url The url that will be matched
     * @param fallback If no route rule matched, getter route will give fallback as return.
     */
    constructor(url: string, fallback: T | null = null) {
        this.url = url;
        this.fallback = fallback;
    }
    match(re: RegExp, cb: ((result: RegExpExecArray) => T)) {
        if (this.result === null) {
            this.result = re.exec(this.url);
            if (this.result !== null) this.callback = cb;
        }
        return this;
    }
    get route(): T | null {
        return this.callback && this.result && this.callback(this.result);
    }
}

export default Route2;

export interface Route2Params<T> {
    re: RegExp | string;
    cb: (reuslt: RegExpMatchArray) => T;
}

export function createRoute2<T>(...routes: Route2Params<T>[]) {
    return (reqUrl: string, fallback: T | null = null) => {
        const matched = routes.map(route => ({
            result: reqUrl.match(route.re),
            cb: route.cb
        })).find(route => route.result);
        return matched?.cb(matched.result!) ?? fallback;
    };
}