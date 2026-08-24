import { bin as d3Bin } from "d3-array";
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
function binXY(source, options) {
  const data = toArray(source);
  const xValues = transformValues(data, options.x);
  const yValues = transformValues(data, options.y);
  const valid = data.flatMap(
    (datum, index) => isFiniteNumber(xValues[index]) && isFiniteNumber(yValues[index]) ? [
      {
        datum,
        index,
        x: xValues[index],
        y: yValues[index]
      }
    ] : []
  );
  const rowByIndex = new Map(valid.map((row) => [row.index, row]));
  const xHistogram = histogram(
    options.xThresholds,
    options.xDomain,
    (row) => row.x
  );
  const yHistogram = histogram(
    options.yThresholds,
    options.yDomain,
    (row) => row.y
  );
  const xTemplate = xHistogram(valid);
  const yTemplate = yHistogram(valid);
  const outputs = options.outputs ?? { value: { reduce: "count" } };
  const groups = materializeGroups(data, options.by);
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
    "binXY"
  );
  const prepared = prepareOutputs(data, outputs);
  return groups.flatMap(({ group, indexes }) => {
    const groupRows = indexes.flatMap((index) => {
      const row = rowByIndex.get(index);
      return row ? [row] : [];
    });
    const cellIndexes = /* @__PURE__ */ new Map();
    for (const row of groupRows) {
      const xPosition = intervalIndex(xTemplate, row.x);
      const yPosition = intervalIndex(yTemplate, row.y);
      if (xPosition < 0 || yPosition < 0) continue;
      const identity = `${xPosition}:${yPosition}`;
      const cell = cellIndexes.get(identity);
      if (cell) cell.push(row.index);
      else cellIndexes.set(identity, [row.index]);
    }
    return xTemplate.flatMap(
      (xEntry, xPosition) => yTemplate.map((yEntry, yPosition) => {
        const sourceIndexes = cellIndexes.get(`${xPosition}:${yPosition}`) ?? [];
        const x1 = xEntry.x0;
        const x2 = xEntry.x1;
        const y1 = yEntry.x0;
        const y2 = yEntry.x1;
        return {
          ...group,
          x: (x1 + x2) / 2,
          x1,
          x2,
          y: (y1 + y2) / 2,
          y1,
          y2,
          source: sourceIndexes.map((index) => data[index]),
          sourceIndexes,
          ...reducePreparedOutputs(
            data,
            sourceIndexes,
            group,
            prepared
          )
        };
      })
    );
  });
}
function intervalIndex(bins, value) {
  return bins.findIndex(
    (entry, index) => entry.x0 !== void 0 && entry.x1 !== void 0 && value >= entry.x0 && (value < entry.x1 || index === bins.length - 1 && value === entry.x1)
  );
}
function histogram(thresholds, domain, value) {
  const result = d3Bin().value(value);
  if (domain) result.domain([Math.min(...domain), Math.max(...domain)]);
  if (Array.isArray(thresholds)) {
    const boundaries = [...thresholds].sort((a, b) => a - b);
    if (boundaries.length < 2)
      throw new TypeError("binXY: boundary sequences require two values");
    result.domain([boundaries[0], boundaries.at(-1)]).thresholds(boundaries.slice(1, -1));
  } else if (typeof thresholds === "number") result.thresholds(thresholds);
  return result;
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
export {
  binXY
};
