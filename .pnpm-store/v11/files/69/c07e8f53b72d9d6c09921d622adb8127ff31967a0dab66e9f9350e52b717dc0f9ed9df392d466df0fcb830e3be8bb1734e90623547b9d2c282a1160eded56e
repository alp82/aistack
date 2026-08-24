import { bin as d3Bin } from "d3-array";
import {
} from "./transform.js";
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
function binX(source, options) {
  return bins(source, options).map(({ lower, upper, ...datum }) => ({
    ...datum,
    x: (lower + upper) / 2,
    x1: lower,
    x2: upper
  }));
}
function binY(source, options) {
  return bins(source, options).map(({ lower, upper, ...datum }) => ({
    ...datum,
    y: (lower + upper) / 2,
    y1: lower,
    y2: upper
  }));
}
function bins(source, options) {
  const data = toArray(source);
  const values = transformValues(data, options.value);
  const rowsByIndex = [];
  const rows = data.flatMap((datum, index) => {
    const value = values[index];
    if (!isFiniteNumber(value)) return [];
    const row = { datum, index, value };
    rowsByIndex[index] = row;
    return [row];
  });
  const groups = materializeGroups(data, options.by).map(
    ({ group, indexes }) => ({
      group,
      rows: indexes.flatMap((index) => {
        const row = rowsByIndex[index];
        return row ? [row] : [];
      })
    })
  );
  const template = createHistogram(options)(rows);
  const first = template[0];
  const last = template.at(-1);
  if (!first || !last || first.x0 === void 0 || last.x1 === void 0) {
    return [];
  }
  const lower = first.x0;
  const upper = last.x1;
  const thresholds = template.slice(0, -1).flatMap((entry) => entry.x1 === void 0 ? [] : [entry.x1]);
  const histogram = d3Bin().value((row) => row.value).domain([lower, upper]).thresholds(thresholds);
  const outputs = options.outputs ?? { value: { reduce: "count" } };
  assertTransformOutputNames(
    outputs,
    [
      ...Object.keys(groups[0]?.group ?? {}),
      "x",
      "x1",
      "x2",
      "y",
      "y1",
      "y2",
      "source",
      "sourceIndexes"
    ],
    "bin"
  );
  const preparedOutputs = prepareOutputs(data, outputs);
  return groups.flatMap(
    ({ group, rows: groupRows }) => histogram(groupRows).map((entry) => {
      const indexes = entry.map((row) => row.index);
      const entryLower = entry.x0 ?? lower;
      const entryUpper = entry.x1 ?? entryLower;
      return {
        ...group,
        lower: entryLower,
        upper: entryUpper,
        source: indexes.map((index) => data[index]),
        sourceIndexes: indexes,
        ...reducePreparedOutputs(data, indexes, group, preparedOutputs)
      };
    })
  );
}
function createHistogram(options) {
  const histogram = d3Bin().value((row) => row.value);
  if (Array.isArray(options.thresholds)) {
    const boundaries = [...new Set(options.thresholds)].filter(isFiniteNumber).sort((left, right) => left - right);
    if (boundaries.length < 2) {
      throw new TypeError(
        "bin: an explicit boundary sequence requires two values"
      );
    }
    const domain = [boundaries[0], boundaries.at(-1)];
    if (options.domain) {
      const configuredDomain = normalizedDomain(options.domain);
      if (configuredDomain[0] !== domain[0] || configuredDomain[1] !== domain[1]) {
        throw new TypeError(
          "bin: domain must match the first and last explicit boundaries"
        );
      }
    }
    histogram.domain(domain);
    histogram.thresholds(boundaries.slice(1, -1));
  } else if (typeof options.thresholds === "number") {
    if (!Number.isFinite(options.thresholds) || options.thresholds <= 0) {
      throw new TypeError("bin: thresholds must be a positive finite number");
    }
    if (options.domain) histogram.domain(normalizedDomain(options.domain));
    histogram.thresholds(Math.floor(options.thresholds));
  } else if (typeof options.thresholds === "function") {
    const threshold = options.thresholds;
    histogram.thresholds(
      (values, minimum, maximum) => threshold(Array.from(values), minimum, maximum)
    );
  } else if (options.domain) {
    histogram.domain(normalizedDomain(options.domain));
  }
  return histogram;
}
function normalizedDomain(domain) {
  if (!domain.every(isFiniteNumber)) {
    throw new TypeError("bin: domain values must be finite numbers");
  }
  if (domain[0] < domain[1]) return [domain[0], domain[1]];
  if (domain[1] < domain[0]) return [domain[1], domain[0]];
  const padding = Math.abs(domain[0]) * 0.05 || 1;
  return [domain[0] - padding, domain[1] + padding];
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
export {
  binX,
  binY
};
