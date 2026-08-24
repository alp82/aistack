import { area as createAreaPath } from "d3-shape";
function d3AreaXCurve(curve) {
  const areaPath = createAreaPath().x0((point) => point[1]).x1((point) => point[2]).y((point) => point[0]).curve(curve);
  return {
    areaX: (right, left) => areaPath(
      right.map(
        (point, index) => [point[1], left[index]?.[0] ?? point[0], point[0]]
      )
    ) ?? ""
  };
}
export {
  d3AreaXCurve
};
