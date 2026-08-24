import {
  channelValues,
  createMark,
  inferredKeyValues,
  isChartKey,
  isChartValue,
  visualValue
} from "./mark.js";
import { valueKey } from "./scales.js";
function link(source, options) {
  const data = Array.isArray(source) ? source : Array.from(source);
  return createMark(({ markIndex }) => {
    const id = options.id ?? `link-${markIndex}`;
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
            fill: "none",
            stroke: color,
            strokeOpacity: options.strokeOpacity === void 0 ? void 0 : visualValue(
              options.strokeOpacity,
              datum,
              datumIndex,
              data,
              1
            ),
            strokeWidth: visualValue(
              options.strokeWidth,
              datum,
              datumIndex,
              data,
              1.5
            ),
            strokeDasharray: options.strokeDasharray,
            lineCap: options.lineCap ?? "round",
            lineJoin: "round"
          };
          nodes.push(
            options.curve ? {
              kind: "polyline",
              key,
              points: [
                [x1, y1],
                [x2, y2]
              ],
              path: options.curve.line([
                [x1, y1],
                [x2, y2]
              ]),
              style
            } : {
              kind: "rule",
              key,
              x1,
              y1,
              x2,
              y2,
              style
            }
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
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            color
          });
        });
        return {
          nodes: [
            {
              kind: "group",
              key: id,
              className: "ts-chart__link",
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
  link
};
