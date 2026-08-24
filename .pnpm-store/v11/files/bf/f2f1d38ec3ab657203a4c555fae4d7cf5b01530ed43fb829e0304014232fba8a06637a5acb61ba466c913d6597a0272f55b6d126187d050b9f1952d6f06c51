import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChartImplementation
} from "./Chart.js";
import {
  CanvasChartImplementation
} from "./CanvasChart.js";
import {
  RendererChartImplementation
} from "./RendererChart.js";
function Chart(props) {
  const { renderTooltipBody, ...chartProps } = props;
  const tooltipBody = useTooltipBody(renderTooltipBody);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      ChartImplementation,
      {
        ...chartProps,
        onTooltipBodyChange: tooltipBody.onChange
      }
    ),
    tooltipBody.portal
  ] });
}
function RendererChart(props) {
  const { renderTooltipBody, ...chartProps } = props;
  const tooltipBody = useTooltipBody(renderTooltipBody);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      RendererChartImplementation,
      {
        ...chartProps,
        onTooltipBodyChange: tooltipBody.onChange
      }
    ),
    tooltipBody.portal
  ] });
}
function CanvasChart(props) {
  const { renderTooltipBody, ...chartProps } = props;
  const tooltipBody = useTooltipBody(renderTooltipBody);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      CanvasChartImplementation,
      {
        ...chartProps,
        onTooltipBodyChange: tooltipBody.onChange
      }
    ),
    tooltipBody.portal
  ] });
}
function useTooltipBody(renderTooltipBody) {
  const [target, setTarget] = React.useState(null);
  const onChange = React.useCallback(
    (nextTarget) => {
      setTarget(nextTarget);
    },
    []
  );
  return {
    onChange: renderTooltipBody ? onChange : void 0,
    portal: renderTooltipBody && target ? createPortal(
      renderTooltipBody({
        points: target.points,
        content: target.content,
        pinned: target.pinned,
        dismiss: target.dismiss,
        defaultBody: /* @__PURE__ */ jsx(DefaultTooltipBody, { content: target.content })
      }),
      target.element
    ) : null
  };
}
function DefaultTooltipBody({
  content
}) {
  if (typeof content === "string") return content;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    content.title ? /* @__PURE__ */ jsxs(
      "div",
      {
        className: "ts-chart-tooltip__title",
        style: {
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontWeight: 650,
          marginBottom: content.rows.length ? "0.3rem" : 0
        },
        children: [
          content.color ? /* @__PURE__ */ jsx(TooltipSwatch, { color: content.color }) : null,
          content.title
        ]
      }
    ) : null,
    content.rows.length ? /* @__PURE__ */ jsx("div", { className: "ts-chart-tooltip__rows", "aria-hidden": "true", children: content.rows.map((row, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "ts-chart-tooltip__row",
        style: {
          display: "grid",
          gridTemplateColumns: "0.55rem minmax(0,1fr) auto",
          alignItems: "center",
          columnGap: "0.4rem"
        },
        children: [
          row.color ? /* @__PURE__ */ jsx(TooltipSwatch, { color: row.color }) : /* @__PURE__ */ jsx("span", {}),
          /* @__PURE__ */ jsx("span", { children: row.label }),
          /* @__PURE__ */ jsx(
            "span",
            {
              style: {
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap"
              },
              children: row.value
            }
          )
        ]
      },
      `${row.label}\0${index}`
    )) }) : null
  ] });
}
function TooltipSwatch({ color }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: "ts-chart-tooltip__swatch",
      "aria-hidden": "true",
      style: {
        display: "block",
        width: "0.55rem",
        height: "0.55rem",
        borderRadius: "0.15rem",
        boxShadow: "inset 0 0 0 1px rgb(0 0 0/.12)",
        background: color
      }
    }
  );
}
export {
  CanvasChart,
  Chart,
  RendererChart
};
