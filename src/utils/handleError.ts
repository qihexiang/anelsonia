import log from "./logger";

export function handleErr(err: Error) {
    log(err.name)
    log(err.message)
    if(err.stack) log(err.stack)
}