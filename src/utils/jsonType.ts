export interface HasToJSON {
  toJSON: () => BasicJSONTypes | JsonArray | JsonObject;
}
export type BasicJSONTypes = string | number | boolean | null;
export type JsonObject = {
  [key: string | number]: JsonType;
};
export type JsonArray = JsonType[];
export type JsonType = JsonObject | JsonArray | BasicJSONTypes | HasToJSON;
