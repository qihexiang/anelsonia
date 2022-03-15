export interface ConditionInit<R extends string> {
    match: <T>(
        pattern: R | R[] | RegExp,
        handler: (reality: R) => T,
    ) => Condition<T, R>;
}

export interface Condition<T, R extends string> {
    match: (
        pattern: R | R[] | RegExp,
        handler: (reality: R) => T,
    ) => Condition<T, R>;
    withDefault: (handler: (reality: R) => T) => T;
    getValue: () => T | null;
}

export function condition<R extends string>(reality: R): ConditionInit<R> {
    return {
        /**
         * Give the first pattern to match.
         *
         * @param pattern a string, string array or a regexp that can match the reality value.
         * @param handler a handler which can deal with the reality value
         * @returns an object that provides match, withDefault and getValue method.
         */
        match: (pattern, handler) => {
            type T = ReturnType<typeof handler>;
            let result: T | null = null;
            if (pattern instanceof RegExp && pattern.exec(reality)) {
                result = handler(reality);
            }
            if (pattern instanceof Array && pattern.includes(reality)) {
                result = handler(reality);
            }
            if (typeof pattern === "string" && pattern === reality) {
                result = handler(reality);
            }
            /**
             * Get the final value.
             *
             * @returns The final value of the condition match
             */
            const getValue: Condition<T, R>["getValue"] = () => result;
            /**
             * Get the final value, if it's null, using a default
             * handler to generate one.
             *
             * @param handler a handler receives the condition value
             * and give a result.
             * @returns The final value of the condition match
             */
            const withDefault: Condition<T, R>["withDefault"] = (handler) =>
                result ?? handler(reality);
            /**
             * Give a pattern to match.
             *
             * @param pattern a string, string array or a regexp that can match the reality value.
             * @param handler a handler which can deal with the reality value
             * @returns an object that provides match, withDefault and getValue method.
             */
            const match: Condition<T, R>["match"] = (pattern, handler) => {
                if (pattern instanceof RegExp && pattern.exec(reality)) {
                    result = handler(reality);
                }
                if (pattern instanceof Array && pattern.includes(reality)) {
                    result = handler(reality);
                }
                if (typeof pattern === "string" && pattern === reality) {
                    result = handler(reality);
                }
                return { match, withDefault, getValue };
            };
            return { match, withDefault, getValue };
        },
    };
}
