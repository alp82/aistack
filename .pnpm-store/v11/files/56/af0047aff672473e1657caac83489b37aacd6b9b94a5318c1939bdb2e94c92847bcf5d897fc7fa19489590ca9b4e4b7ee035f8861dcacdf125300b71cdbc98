import { stackValues } from "./stack-internal.js";
import {
} from "./transform.js";
import { toArray, transformValues } from "./transform-internal.js";
function stackRowsY(source, options) {
  const data = toArray(source);
  const positions = transformValues(data, options.x);
  const values = transformValues(data, options.y);
  const series = options.z !== void 0 ? transformValues(data, options.z) : data.map(() => "value");
  const stackableValues = values.map(
    (value, index) => isChartValue(positions[index]) && isChartKey(series[index]) ? value : void 0
  );
  const { starts, ends } = stackValues(
    positions,
    stackableValues,
    series,
    options,
    "value"
  );
  return data.flatMap((datum, index) => {
    const value = values[index];
    const position = positions[index];
    const seriesValue = series[index];
    const start = starts[index];
    const end = ends[index];
    if (!isFiniteNumber(value) || !isChartValue(position) || !isChartKey(seriesValue) || start === void 0 || end === void 0) {
      return [];
    }
    return [
      {
        ...datum,
        x: position,
        y: value,
        y1: start,
        y2: end,
        z: seriesValue,
        source: [datum],
        sourceIndexes: [index]
      }
    ];
  });
}
function stackRowsX(source, options) {
  const data = toArray(source);
  const values = transformValues(data, options.x);
  const positions = transformValues(data, options.y);
  const series = options.z !== void 0 ? transformValues(data, options.z) : data.map(() => "value");
  const stackableValues = values.map(
    (value, index) => isChartValue(positions[index]) && isChartKey(series[index]) ? value : void 0
  );
  const { starts, ends } = stackValues(
    positions,
    stackableValues,
    series,
    options,
    "value"
  );
  return data.flatMap((datum, index) => {
    const value = values[index];
    const position = positions[index];
    const seriesValue = series[index];
    const start = starts[index];
    const end = ends[index];
    if (!isFiniteNumber(value) || !isChartValue(position) || !isChartKey(seriesValue) || start === void 0 || end === void 0) {
      return [];
    }
    return [
      {
        ...datum,
        x: value,
        x1: start,
        x2: end,
        y: position,
        z: seriesValue,
        source: [datum],
        sourceIndexes: [index]
      }
    ];
  });
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function isChartValue(value) {
  return typeof value === "string" || typeof value === "number" && Number.isFinite(value) || value instanceof Date && Number.isFinite(value.getTime());
}
function isChartKey(value) {
  return typeof value === "string" || typeof value === "number";
}
export {
  stackRowsX,
  stackRowsY
};
