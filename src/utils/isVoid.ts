type Void = void | undefined | null | "" | 0;
type Voids<T extends Void> = T[];

export const fullIsVoid = <V extends Void>(
    initValue: unknown,
    voidValues: Voids<V>
): initValue is Extract<typeof initValue, V> => {
    return voidValues.reduce(
        (current, next) => current || next === initValue,
        false as boolean
    );
};

export const isVoid = (
    initValue: unknown
): initValue is Extract<typeof initValue, undefined | null> => {
    return fullIsVoid(initValue, [undefined, null]);
};
