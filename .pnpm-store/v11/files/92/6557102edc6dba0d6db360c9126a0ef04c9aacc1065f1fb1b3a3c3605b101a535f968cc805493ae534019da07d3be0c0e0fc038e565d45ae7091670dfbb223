import { transformValues } from "./transform-internal.js";
function prepareOutputs(data, outputs) {
  return Object.fromEntries(
    Object.entries(outputs).map(([name, spec]) => [
      name,
      {
        spec,
        values: spec.value !== void 0 ? transformValues(data, spec.value) : []
      }
    ])
  );
}
function assertTransformOutputNames(outputs, reserved, transform) {
  const collision = Object.keys(outputs).find((name) => reserved.includes(name));
  if (collision) {
    throw new TypeError(
      `${transform}: output name "${collision}" is reserved by the transform`
    );
  }
}
function reducePreparedOutputs(data, indexes, group, outputs) {
  const entries = Object.entries(outputs).map(([name, output]) => [
    name,
    reducePreparedOutput(data, indexes, group, output)
  ]);
  return Object.fromEntries(entries);
}
function reducePreparedOutput(data, indexes, group, output) {
  const values = indexes.flatMap((index) => {
    const value = output.values[index];
    return isFiniteNumber(value) ? [value] : [];
  });
  const selectedData = indexes.flatMap(
    (index) => index in data ? [data[index]] : []
  );
  const reducer = output.spec.reduce;
  if (typeof reducer === "function") {
    return reducer({ values, data: selectedData, indexes, group });
  }
  if (reducer === "count") return selectedData.length;
  if (!values.length) return reducer === "sum" ? 0 : Number.NaN;
  if (reducer === "sum") {
    return values.reduce((total, value) => total + value, 0);
  }
  if (reducer === "mean") {
    return values.reduce((total, value) => total + value, 0) / values.length;
  }
  if (reducer === "min") return Math.min(...values);
  return Math.max(...values);
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
export {
  assertTransformOutputNames,
  prepareOutputs,
  reducePreparedOutputs
};
