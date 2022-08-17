import { Route } from "../router";
import { requests } from "./shimHTTP";

/**
 * Get `HttpReq` from anywhere called by callback of shimHTTP
 *
 * @returns `HttpReq` object
 */
export const useRequest = () => {
    const req = requests.getStore();
    if (req === undefined)
        throw new Error(
            "Can't get request, is this function called by main function?"
        );
    return req;
};

/**
 * Get host, path and query object from the request.
 */
export function useURL(): URL;

/**
 * Get request method.
 *
 * @param prop method
 */
export function useURL(prop: "method"): string;
/**
 * Get request path from the request.
 *
 * @param prop path
 */
export function useURL(prop: "path"): string;
/**
 * Get hostname from the request.
 *
 * @param prop host
 */
export function useURL(prop: "host"): string;
/**
 * Get the search params from the ruquest.
 *
 * @param prop query
 */
export function useURL(prop: "query"): URLSearchParams;
/**
 * Get the route result from the router
 *
 * @param prop the router you want to use
 */
export function useURL<T>(prop: (url: string) => T): T;
export function useURL<T>(
    prop?: "path" | "host" | "query" | "method" | Route<T>
) {
    const req = requests.getStore();
    if (req === undefined)
        throw new Error(
            "Can't get request, is this function called by main function?"
        );
    const method = req.method ?? "GET";
    if (prop === "method") return method;
    const host = req.headers.host ?? "localhost";
    if (prop === "host") return host;
    const path = req.url ?? "/";
    if (prop === "path") return path;
    const url = new URL(path, `http://${host}`);
    if (prop === "query") return url.searchParams;
    if (prop === undefined) return url;
    return prop(url.pathname);
}
