import { createProxy } from "./createWrapper";
import { isVoid } from "./isVoid";

export const CacheMap = <K extends Array<any>, V>() => {
    let keyArray: K[] = [];
    let valueArray: V[] = [];
    const has = (key: K) => {
        const element = keyArray.find((k) => {
            return k.reduce(
                (result, next, index) =>
                    result &&
                    (next === key[index] || Object.is(next, key[index])),
                true
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
            return keyArray;
        },
    };
};

/**
 * Create a cache wrapper for a function. The wrapped function
 * will return the cached value if found the same arguments. Comparation
 * rule is same-value-zero.
 *
 * ***Be carefull! This may lead to OOM!*** You should only employ this
 * wrapper to a simple caculation function, and do not use Inifity as the
 * expire time.
 *
 * @param fn the original function.
 * @param expire the time that a cached expired. Default to Inifinity
 * @returns a wrapped function.
 */
export function memoryCache<F extends (...args: any[]) => any>(
    fn: F,
    expire = Infinity
) {
    type FnParams = Parameters<F>;
    type ReturnValue = ReturnType<F>;
    const cacheMapWithExpire = CacheMap<
        FnParams,
        { createdAt: number; value: ReturnValue }
    >();
    const cacheMapWithoutExpire = CacheMap<FnParams, ReturnValue>();
    return Number.isFinite(expire)
        ? createProxy<F>((...args) => {
              const now = new Date().getTime();
              const cached = cacheMapWithExpire.get(args);
              setTimeout(() => {
                  const entries = cacheMapWithExpire.entries();
                  for (const entry of entries) {
                      if (
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          now - cacheMapWithExpire.get(entry)!.createdAt <=
                          expire
                      ) {
                          cacheMapWithExpire.delete(entry);
                      }
                  }
              });
              if (
                  isVoid(cached, [undefined]) ||
                  now - cached.createdAt >= expire
              ) {
                  return [
                      args,
                      (value: ReturnType<F>) => {
                          cacheMapWithExpire.set(args, {
                              createdAt: new Date().getTime(),
                              value,
                          });
                          return value;
                      },
                  ];
              } else {
                  return [null, () => cached.value];
              }
          })(fn)
        : createProxy<F>((...args) => {
              const cached = cacheMapWithoutExpire.get(args);
              if (isVoid(cached, [undefined])) {
                  return [
                      args,
                      (value) => {
                          cacheMapWithoutExpire.set(args, value);
                          return value;
                      },
                  ];
              } else {
                  return [null, () => cached];
              }
          })(fn);
}
