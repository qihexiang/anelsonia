export type Void = undefined | null;
export type Voids<T extends Void> = T[];

/**
 * Find out if the value is null or undefined.
 *
 * @param initValue the value to be cheched.
 * @param voidValues specify if the void value refers to undefined or null, or undefined and null
 * @returns boolean
 */
export const isVoid = <T, V extends Void = undefined | null>(
    initValue: T,
    voidValues?: Voids<V>
): initValue is Extract<T, V> => {
    return (voidValues ?? ([undefined, null] as Voids<V>)).reduce(
        (current, next) => current || next === (initValue as unknown),
        false as boolean
    );
};
