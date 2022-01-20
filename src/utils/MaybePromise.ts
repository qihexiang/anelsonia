export type MaybePromise<T> = T extends Promise<infer N> ? Promise<N> : (T | Promise<T>);
export default MaybePromise;
