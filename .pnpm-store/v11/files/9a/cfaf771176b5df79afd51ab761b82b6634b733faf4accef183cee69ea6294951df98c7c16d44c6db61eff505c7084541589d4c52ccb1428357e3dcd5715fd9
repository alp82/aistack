import {
  materializeGroups,
  toArray,
  transformValues
} from "./transform-internal.js";
function select(source, options) {
  const data = toArray(source);
  const values = options.value !== void 0 ? transformValues(data, options.value) : data.map(() => void 0);
  const selected = [];
  for (const { group, indexes } of materializeGroups(data, options.by)) {
    if (typeof options.select === "function") {
      const result = options.select({
        values: indexes.map((index) => values[index]),
        data: indexes.map((index) => data[index]),
        indexes,
        group
      });
      const allowed = new Set(indexes);
      if (typeof result === "number") {
        if (allowed.has(result)) selected.push(result);
      } else if (result) {
        selected.push(...result.filter((index) => allowed.has(index)));
      }
      continue;
    }
    if (options.select === "first") {
      if (indexes[0] !== void 0) selected.push(indexes[0]);
      continue;
    }
    if (options.select === "last") {
      const index = indexes.at(-1);
      if (index !== void 0) selected.push(index);
      continue;
    }
    if (!options.value) {
      throw new TypeError(`select: "${options.select}" requires a value`);
    }
    let selectedIndex;
    let selectedValue;
    for (const index of indexes) {
      const value = values[index];
      if (!isFiniteNumber(value)) continue;
      if (selectedValue === void 0 || options.select === "min" && value < selectedValue || options.select === "max" && value > selectedValue) {
        selectedIndex = index;
        selectedValue = value;
      }
    }
    if (selectedIndex !== void 0) selected.push(selectedIndex);
  }
  return [...new Set(selected)].sort((left, right) => left - right).flatMap((index) => index in data ? [data[index]] : []);
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
export {
  select
};
