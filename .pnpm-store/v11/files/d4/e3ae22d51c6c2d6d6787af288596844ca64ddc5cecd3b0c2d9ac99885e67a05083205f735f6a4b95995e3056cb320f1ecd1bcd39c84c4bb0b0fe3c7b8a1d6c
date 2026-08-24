import { createMark } from "./mark.js";
function frame(options = {}) {
  return createMark(({ markIndex }) => {
    const id = options.id ?? `frame-${markIndex}`;
    return {
      id,
      channels: {},
      render: ({ chart, theme }) => {
        const inset = Math.max(0, options.inset ?? 0);
        return {
          nodes: [
            {
              kind: "group",
              key: id,
              className: "ts-chart__frame",
              ariaHidden: true,
              children: [
                {
                  kind: "rect",
                  key: `${id}:rect`,
                  x: chart.x + inset,
                  y: chart.y + inset,
                  width: Math.max(0, chart.width - inset * 2),
                  height: Math.max(0, chart.height - inset * 2),
                  radius: options.radius,
                  style: {
                    fill: options.fill ?? "none",
                    fillOpacity: options.fillOpacity,
                    stroke: options.stroke ?? theme.foreground,
                    strokeOpacity: options.strokeOpacity ?? 0.35,
                    strokeWidth: options.strokeWidth ?? 1
                  }
                }
              ]
            }
          ]
        };
      }
    };
  }, options.motion);
}
export {
  frame
};
