import { createRes } from "../core/Respond.ts";

/**
 * A object that has toJSON methods.
 */
export interface HasToJSON {
    toJSON: () => BasicJSONTypes | JsonArray | JsonObject;
}
/**
 * Basic types of JSON
 */
export type BasicJSONTypes = string | number | boolean | null;
/**
 * A valid object of JSON
 */
export type JsonObject = {
    [key: string | number]: JsonType;
};
/**
 * A valid Array of JSON
 */
export type JsonArray = JsonType[];
/**
 * All types that can be transformed to JSON
 */
export type JsonType = JsonObject | JsonArray | BasicJSONTypes | HasToJSON;

/**
 * Return something can be defined as json.
 *
 * @param json the json content you'd like to send.
 * @returns Respond with json content
 */
export function resJson<T extends JsonType>(json: T) {
    const body = JSON.stringify(json);
    return createRes(body, ["Content-Type", "application/json"]);
}
