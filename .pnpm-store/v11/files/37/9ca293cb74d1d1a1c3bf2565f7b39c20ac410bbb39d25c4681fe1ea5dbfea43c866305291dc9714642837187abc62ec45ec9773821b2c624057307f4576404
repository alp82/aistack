import { materializeGroups, toArray } from "./transform-internal.js";
import {
  assertTransformOutputNames,
  prepareOutputs,
  reducePreparedOutputs
} from "./transform-reduce-internal.js";
function groupBy(source, options) {
  const data = toArray(source);
  const groups = materializeGroups(data, options.by);
  const groupNames = groups[0] ? Object.keys(groups[0].group) : [];
  assertTransformOutputNames(
    options.outputs,
    [...groupNames, "source", "sourceIndexes"],
    "groupBy"
  );
  const preparedOutputs = prepareOutputs(data, options.outputs);
  return groups.map(({ group, indexes }) => ({
    ...group,
    source: indexes.map((index) => data[index]),
    sourceIndexes: indexes,
    ...reducePreparedOutputs(
      data,
      indexes,
      group,
      preparedOutputs
    )
  }));
}
export {
  groupBy
};
