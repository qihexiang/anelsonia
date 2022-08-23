import { setTimeout } from "timers/promises";
import { Fn } from "./createWrapper";
import { memoryCache } from "./memory";

test("fibbonacci function by memory cache", async () => {
    const fib = memoryCache((index: number): number => {
        if (index === 0 || index === 1) return 1;
        else return fib(index - 1) + fib(index - 2);
    }, 1000);
    function used<F extends Fn>(fn: F, ...args: Parameters<F>): number {
        const start = new Date().getTime();
        fn(...args);
        return new Date().getTime() - start;
    }
    const firstTime = used(fib, 1000);
    const secondTime = used(fib, 1000);
    expect(firstTime).toBeGreaterThan(100);
    expect(firstTime).toBeLessThan(1000);
    expect(secondTime).toBeLessThan(10);
    await setTimeout(2000);
    const afterTimeout = used(fib, 1000);
    expect(afterTimeout).toBeGreaterThan(100);
    expect(afterTimeout).toBeLessThan(1000);
});
