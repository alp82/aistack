import {
  materializeGroups,
  toArray,
  transformValues
} from "./transform-internal.js";
function normalize(source, options) {
  const data = toArray(source);
  const rawValues = transformValues(data, options.value);
  const outputName = options.as ?? "normalized";
  if (outputName === "source" || outputName === "sourceIndexes") {
    throw new TypeError(`normalize: output name "${outputName}" is reserved`);
  }
  const output = [];
  for (const { group, indexes } of materializeGroups(data, options.by)) {
    const validIndexes = indexes.filter(
      (index) => isFiniteNumber(rawValues[index])
    );
    const values = validIndexes.map((index) => rawValues[index]);
    const groupData = validIndexes.map((index) => data[index]);
    const basis = options.basis ?? "sum";
    const denominator = typeof basis === "function" ? basis({ values, data: groupData, indexes: validIndexes, group }) : resolveDenominator(values, basis);
    const minimum = basis === "extent" && values.length ? Math.min(...values) : 0;
    for (const index of validIndexes) {
      const rawValue = rawValues[index];
      const normalized = basis === "extent" ? denominator === 0 ? 0 : (rawValue - minimum) / denominator : denominator === 0 ? 0 : rawValue / denominator;
      output.push({
        ...data[index],
        [outputName]: normalized,
        source: [data[index]],
        sourceIndexes: [index]
      });
    }
  }
  return output;
}
function resolveDenominator(values, basis) {
  if (!values.length) return 0;
  if (basis === "sum") return values.reduce((total, value) => total + value, 0);
  if (basis === "max") return Math.max(...values.map(Math.abs));
  if (basis === "extent") return Math.max(...values) - Math.min(...values);
  if (basis === "first") return values[0] ?? 0;
  return values.at(-1) ?? 0;
}
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}
export {
  normalize
};
