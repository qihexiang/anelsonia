import { isEnum } from "./isEnum";

test("isEnum test", () => {
    expect(isEnum(1, [1, 2, 4, 5, 6, "hello", "result"])).toBe(true)
    expect(isEnum("hello", [1, 2, 4, 5, 6, "hello", "result"])).toBe(true)
    expect(isEnum(3, [1, 2, 4, 5, 6, "hello", "result"])).toBe(false)
    expect(isEnum("destiny", [1, 2, 4, 5, 6, "hello", "result"])).toBe(false)
});
