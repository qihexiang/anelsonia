interface ConditionCallback<T> {
    (condition: string): T;
}

interface Condition<T> {
    match: (condition: string, callback: ConditionCallback<T>) => Condition<T>;
    getResult: () => T | null;
}

export function condition<T>(reality: string): Condition<T> {
    let result: T | null = null;
    function getResult() {
        return result;
    }
    function match(condition: string, callback: (condition: string) => T): Condition<T> {
        if (condition === reality) result = callback(reality);
        return {
            match, getResult
        };
    }
    return { match, getResult };
}
