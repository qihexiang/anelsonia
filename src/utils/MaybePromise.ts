/**
 * MaybePromise is something that can may be wrapped in a Promise.
 */
export type MaybePromise<T> = T | Promise<T>;
export default MaybePromise;
