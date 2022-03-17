import { createWrapper } from "./createWrapper.ts";
import { isVoid } from "./isVoid.ts";

// deno-lint-ignore no-explicit-any
export const CacheMap = <K extends Array<any>, V>() => {
    let keyArray: K[] = [];
    let valueArray: V[] = [];
    const has = (key: K) => {
        const element = keyArray.find((k) => {
            return k.reduce(
                (result, next, index) => result && next === key[index],
                true,
            );
        });
        return isVoid(element) ? null : keyArray.indexOf(element);
    };
    return {
        has(k: K) {
            return !isVoid(has(k));
        },
        set(k: K, v: V) {
            const index = has(k);
            if (isVoid(index)) {
                keyArray = [...keyArray, k];
                valueArray = [...valueArray, v];
            } else {
                keyArray[index] = k;
                valueArray[index] = v;
            }
        },
        get(k: K) {
            const index = has(k);
            if (isVoid(index)) return undefined;
            else return valueArray[index];
        },
        delete(k: K) {
            const index = has(k);
            if (!isVoid(index)) {
                keyArray = [
                    ...keyArray.slice(0, index),
                    ...keyArray.slice(index + 1),
                ];
                valueArray = [
                    ...valueArray.slice(0, index),
                    ...valueArray.slice(index + 1),
                ];
            }
        },
        entries(): Readonly<K[]> {
            return keyArray
        }
    };
};

// deno-lint-ignore no-explicit-any
export function memoryCache<F extends (...args: any[]) => any>(
    fn: F,
    expire = Infinity,
) {
    type FnParams = Parameters<F>;
    type ReturnValue = ReturnType<F>;
    const cacheMapWithExpire = CacheMap<
        FnParams,
        { createdAt: number; value: ReturnValue }
    >();
    const cacheMapWithoutExpire = CacheMap<
        FnParams,
        ReturnValue
    >();
    return Number.isFinite(expire)
        ? createWrapper<F>(
            (...args) => {
                const now = new Date().getTime();
                const cached = cacheMapWithExpire.get(args);
                setTimeout(() => {
                    const entries = cacheMapWithExpire.entries();
                    for (const entry of entries) {
                        if (now - cacheMapWithExpire.get(entry)!.createdAt <= expire) {
                            cacheMapWithExpire.delete(entry)
                        }
                    }
                })
                if (isVoid(cached, [undefined]) || now - cached.createdAt >= expire) {
                    return [args, (value) => {
                        cacheMapWithExpire.set(args, {
                            createdAt: new Date().getTime(),
                            value,
                        });
                        return value;
                    }];
                } else {
                    return [null, () => cached.value];
                }
            },
        )(fn)
        : createWrapper<F>(
            (...args) => {
                const cached = cacheMapWithoutExpire.get(args);
                if(isVoid(cached, [undefined])) {
                    return [args, (value) => {
                        cacheMapWithoutExpire.set(args, value)
                        return value
                    }]
                } else {
                    return [null, () => cached]
                }
            },
        )(fn);
}
