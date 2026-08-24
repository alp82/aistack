import { jsx } from "react/jsx-runtime";
import * as React from "react";
import { canvasChartRenderer } from "@tanstack/charts/canvas";
import {
  RendererChartImplementation
} from "./RendererChart.js";
function CanvasChart(props) {
  return /* @__PURE__ */ jsx(CanvasChartImplementation, { ...props });
}
function CanvasChartImplementation(props) {
  return /* @__PURE__ */ jsx(RendererChartImplementation, { ...props, renderer: canvasChartRenderer });
}
export {
  CanvasChart,
  CanvasChartImplementation
};
