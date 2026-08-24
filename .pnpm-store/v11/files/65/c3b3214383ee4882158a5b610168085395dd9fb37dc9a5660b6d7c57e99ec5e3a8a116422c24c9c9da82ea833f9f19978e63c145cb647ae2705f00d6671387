"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function stringifyWithBigInt(data) {
  return JSON.stringify(data, (_key, value) => {
    if (typeof value === "bigint") {
      return {
        __type: "bigint",
        value: value.toString()
      };
    }
    return value;
  });
}
function parseWithBigInt(json) {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === "object" && value.__type === "bigint" && typeof value.value === "string") {
      return BigInt(value.value);
    }
    return value;
  });
}
exports.parseWithBigInt = parseWithBigInt;
exports.stringifyWithBigInt = stringifyWithBigInt;
//# sourceMappingURL=json.cjs.map
