type Void = undefined | null;
type Voids<T extends Void> = T[];

export const isVoid = <T, V extends Void = undefined | null>(
    initValue: T,
    voidValues?: Voids<V>,
): initValue is Extract<T, V> => {
    return (voidValues ?? ([undefined, null] as Voids<V>)).reduce(
        (current, next) => current || next === (initValue as unknown),
        false as boolean,
    );
};
