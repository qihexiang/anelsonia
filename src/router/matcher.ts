export function condition<T>(reality: string) {
    let result: T | null = null;
    function getResult() {
        return result
    }
    function match(condition: string, callback: (condition: string) => T) {
        if (condition === reality) result = callback(reality);
        return {
            match, getResult
        };
    }
    return { match, getResult };
}
