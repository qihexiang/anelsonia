/**
 * Get a request from the Request comes in.
 *
 * @param req the request object
 * @returns a URL instance
 */
export function parseURL(req: Request) {
    return new URL(req.url);
}
