/**
 * Check if a string/number is a enumed value
 *
 * @param value The value to be checked
 * @param enums The enums
 * @returns
 */
export function isEnum<E extends string | number>(
    value: string | number,
    enums: E[]
): value is E {
    return (enums as Array<string | number>).includes(value);
}
