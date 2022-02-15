type Void = void | undefined | null | "" | 0;
type Voids<T extends Void> = T[];

export const fullIsVoid = <T, V extends Void>(
    initValue: T,
    voidValues: Voids<V>
): initValue is Extract<T, V> => {
    return voidValues.reduce(
        (current, next) => current || (next as unknown) === initValue,
        false as boolean
    );
};

export const isVoid = <T>(
    initValue: T
): initValue is Extract<T, undefined | null> => {
    return fullIsVoid(initValue, [undefined, null]);
};
