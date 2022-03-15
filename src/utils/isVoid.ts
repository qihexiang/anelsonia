type Void = undefined | null;
type Voids<T extends Void> = T[];

/**
 * Check if the given value is a void value.
 *
 * @param initValue the value need to be check
 * @param voidValues void values, can be `[null]`,`[undefined]` and `[null, undefined]`(default)
 * @returns a boolean, and infer if the value can be null or undefined.
 */
export function isVoid<T, V extends Void = undefined | null>(
    initValue: T,
    voidValues?: Voids<V>,
): initValue is Extract<T, V> {
    return (voidValues ?? ([undefined, null] as Voids<V>)).reduce(
        (current, next) => current || next === (initValue as unknown),
        false as boolean,
    );
}
