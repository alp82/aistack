import {
  materializeGroups,
  toArray,
  transformValues
} from "./transform-internal.js";
import {
  assertTransformOutputNames,
  prepareOutputs,
  reducePreparedOutputs
} from "./transform-reduce-internal.js";
function binTimeX(source, options) {
  return binTime(source, options, "x");
}
function binTimeY(source, options) {
  return binTime(source, options, "y");
}
function binTime(source, options, axis) {
  const data = toArray(source);
  const values = transformValues(data, options.value);
  const valid = values.flatMap(
    (value, index) => value instanceof Date && Number.isFinite(value.getTime()) ? [{ value, index }] : []
  );
  if (!valid.length && !options.domain) return [];
  const domainStart = options.domain?.[0] ?? new Date(Math.min(...valid.map(({ value }) => value.getTime())));
  const domainEnd = options.domain?.[1] ?? new Date(Math.max(...valid.map(({ value }) => value.getTime())));
  const minimum = domainStart < domainEnd ? domainStart : domainEnd;
  const maximum = domainStart < domainEnd ? domainEnd : domainStart;
  const start = options.interval.floor(new Date(minimum));
  const stop = options.interval.offset(
    options.interval.floor(new Date(maximum)),
    1
  );
  const boundaries = options.interval.range(
    start,
    options.interval.offset(stop, 1)
  );
  const outputs = options.outputs ?? { value: { reduce: "count" } };
  const groups = materializeGroups(data, options.by);
  assertTransformOutputNames(
    outputs,
    [
      ...Object.keys(groups[0]?.group ?? {}),
      axis,
      `${axis}1`,
      `${axis}2`,
      "source",
      "sourceIndexes"
    ],
    "binTime"
  );
  const prepared = prepareOutputs(data, outputs);
  return groups.flatMap(({ group, indexes }) => {
    const binIndexes = /* @__PURE__ */ new Map();
    for (const index of indexes) {
      const value = values[index];
      if (!(value instanceof Date)) continue;
      const identity = options.interval.floor(value).getTime();
      const bucket = binIndexes.get(identity);
      if (bucket) bucket.push(index);
      else binIndexes.set(identity, [index]);
    }
    return boundaries.slice(0, -1).map((lower, position) => {
      const upper = boundaries[position + 1];
      const sourceIndexes = binIndexes.get(lower.getTime()) ?? [];
      return {
        ...group,
        [axis]: new Date((lower.getTime() + upper.getTime()) / 2),
        [`${axis}1`]: lower,
        [`${axis}2`]: upper,
        source: sourceIndexes.map((index) => data[index]),
        sourceIndexes,
        ...reducePreparedOutputs(data, sourceIndexes, group, prepared)
      };
    });
  });
}
export {
  binTimeX,
  binTimeY
};
