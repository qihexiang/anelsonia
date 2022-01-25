export type MaybePromise<T> = T | TPromise<T>;
export type TPromise<T> = T extends Promise<infer N> ? TPromise<N> : Promise<T>;
export default MaybePromise;
