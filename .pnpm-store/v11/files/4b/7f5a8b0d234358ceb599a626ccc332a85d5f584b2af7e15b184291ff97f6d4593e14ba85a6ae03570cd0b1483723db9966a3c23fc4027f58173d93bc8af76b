import {
  channelValues,
  createMark,
  inferredKeyValues,
  isChartKey,
  isChartValue,
  visualValue
} from "./mark.js";
import { arrowGeometry } from "./arrow-geometry.js";
import { valueKey } from "./scales.js";
function arrow(source, options) {
  const data = Array.isArray(source) ? source : Array.from(source);
  return createMark(({ markIndex }) => {
    const id = options.id ?? `arrow-${markIndex}`;
    const x1Values = channelValues(data, options.x1, () => void 0);
    const y1Values = channelValues(data, options.y1, () => void 0);
    const x2Values = channelValues(data, options.x2, () => void 0);
    const y2Values = channelValues(data, options.y2, () => void 0);
    const zValues = channelValues(data, options.z, () => null);
    const colorValues = options.color === void 0 ? zValues : channelValues(data, options.color, () => null);
    const keys = inferredKeyValues(data, options.key, { groups: zValues });
    return {
      id,
      channels: {
        x: {
          scale: "x",
          values: [...x1Values, ...x2Values].filter(isChartValue)
        },
        y: {
          scale: "y",
          values: [...y1Values, ...y2Values].filter(isChartValue)
        },
        color: {
          scale: "color",
          values: colorValues.filter(isChartKey)
        }
      },
      render: ({ scales, color: resolveColor }) => {
        const nodes = [];
        const points = [];
        const headLength = Math.max(0, options.headLength ?? 8);
        const headAngle = (options.headAngle ?? 30) * Math.PI / 180;
        data.forEach((datum, datumIndex) => {
          const x1Value = x1Values[datumIndex];
          const y1Value = y1Values[datumIndex];
          const x2Value = x2Values[datumIndex];
          const y2Value = y2Values[datumIndex];
          if (!isChartValue(x1Value) || !isChartValue(y1Value) || !isChartValue(x2Value) || !isChartValue(y2Value)) {
            return;
          }
          const x1 = scales.x.map(x1Value);
          const y1 = scales.y.map(y1Value);
          const x2 = scales.x.map(x2Value);
          const y2 = scales.y.map(y2Value);
          const group = zValues[datumIndex] ?? null;
          const color = visualValue(
            options.stroke,
            datum,
            datumIndex,
            data,
            resolveColor(colorValues[datumIndex] ?? null)
          );
          const key = `${id}:${valueKey(group)}:${valueKey(keys[datumIndex])}`;
          const style = {
            stroke: color,
            strokeOpacity: options.strokeOpacity,
            strokeWidth: options.strokeWidth ?? 1.5,
            lineCap: "round",
            lineJoin: "round"
          };
          nodes.push(
            arrowGeometry({
              key,
              x1,
              y1,
              x2,
              y2,
              headLength,
              headAngle,
              style
            })
          );
          points.push({
            key,
            markId: id,
            group,
            groupLabel: group == null ? id : String(group),
            datum,
            datumIndex,
            xValue: x2Value,
            yValue: y2Value,
            x1Value,
            x2Value,
            y1Value,
            y2Value,
            xInterval: "range",
            yInterval: "range",
            x: x2,
            y: y2,
            color
          });
        });
        return {
          nodes: [
            {
              kind: "group",
              key: id,
              className: "ts-chart__arrow",
              ariaHidden: true,
              children: nodes
            }
          ],
          points
        };
      }
    };
  }, options.motion);
}
export {
  arrow
};
