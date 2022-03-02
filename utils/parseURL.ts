/**
 * Get a request from the Request comes in.
 *
 * @param req the request object
 * @returns a URL instance
 */
export const parseURL = (req: Request) => new URL(req.url);
