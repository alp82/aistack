import {
  materializeGroups,
  orderedIndexes,
  toArray
} from "./transform-internal.js";
import {
  assertTransformOutputNames,
  prepareOutputs,
  reducePreparedOutputs
} from "./transform-reduce-internal.js";
function cumulative(source, options) {
  const data = toArray(source);
  assertTransformOutputNames(
    options.outputs,
    ["source", "sourceIndexes"],
    "cumulative"
  );
  const prepared = prepareOutputs(data, options.outputs);
  return materializeGroups(data, options.by).flatMap(({ group, indexes }) => {
    const ordered = orderedIndexes(
      data,
      indexes,
      options.orderBy,
      options.order
    );
    return ordered.map((index, position) => {
      const sourceIndexes = ordered.slice(0, position + 1);
      return {
        ...data[index],
        source: sourceIndexes.map((sourceIndex) => data[sourceIndex]),
        sourceIndexes,
        ...reducePreparedOutputs(
          data,
          sourceIndexes,
          group,
          prepared
        )
      };
    });
  });
}
export {
  cumulative
};
