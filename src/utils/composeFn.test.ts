import { composeFn } from "./composeFn";

test("compuse a function to calc sqrt( x ^ 2 + 16 )", () => {
    expect(
        composeFn((x: number) => x ** 2)
            .next((x) => x + 16)
            .next(Math.sqrt)
            .fn(2)
    ).toBe(Math.sqrt(20));
});
