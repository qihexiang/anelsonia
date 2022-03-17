import { createWrapper } from "./createWrapper.ts";
import { isVoid } from "./isVoid.ts";

// deno-lint-ignore no-explicit-any
export function memoryCache<F extends (...args: any[]) => any>(
    fn: F,
    expire = Infinity,
) {
    type FnParams = Parameters<F>;
    type ReturnValue = ReturnType<F>;
    const cacheMap = new Map<
        FnParams,
        { createdAt: number; value: ReturnValue }
    >();
    return createWrapper<F>(
        (...args) => {
            const now = new Date().getTime();
            const cached = cacheMap.get(args);
            if (isVoid(cached) || now - cached.createdAt >= expire) {
                return [args, (value) => {
                    cacheMap.set(args, {
                        createdAt: new Date().getTime(),
                        value,
                    });
                    return value;
                }];
            } else {
                return [null, () => cached.value];
            }
        },
    )(fn);
}
