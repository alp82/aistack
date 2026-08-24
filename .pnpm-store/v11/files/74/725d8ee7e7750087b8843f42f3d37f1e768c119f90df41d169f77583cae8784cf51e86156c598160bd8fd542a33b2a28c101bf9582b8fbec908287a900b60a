import {
  area as createAreaPath,
  line as createLinePath
} from "d3-shape";
function d3Curve(curve) {
  const linePath = createLinePath().x((point) => point[0]).y((point) => point[1]).curve(curve);
  const areaPath = createAreaPath().x((point) => point[0]).y0((point) => point[1]).y1((point) => point[2]).curve(curve);
  return {
    line: (points) => linePath(points) ?? "",
    area: (top, bottom) => areaPath(
      top.map(
        (point, index) => [point[0], bottom[index]?.[1] ?? point[1], point[1]]
      )
    ) ?? ""
  };
}
export {
  d3Curve
};
