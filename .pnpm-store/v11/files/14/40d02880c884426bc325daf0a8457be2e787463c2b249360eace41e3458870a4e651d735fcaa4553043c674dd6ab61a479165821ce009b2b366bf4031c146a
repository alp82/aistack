import { isChartValue, isFiniteNumber } from "./mark.js";
function resolveScaleInput(source, options) {
  const infer = isScaleFactory(source);
  const created = infer ? source() : source;
  if (typeof created !== "function" || typeof created.copy !== "function" || typeof created.domain !== "function" || typeof created.range !== "function") {
    throw new TypeError(
      "A scale factory must return a copyable scale with domain and range methods"
    );
  }
  const scale = created.copy();
  if (infer) {
    const domain = inferScaleDomain(scale, options.values, options.includeZero);
    if (domain) {
      const inferable = scale;
      inferable.domain(domain);
    }
  }
  applyScaleNice(scale, options.nice, options.niceCount);
  return scale;
}
function isScaleFactory(source) {
  return typeof source === "function" && !("copy" in source);
}
function resolveNumericScale(source, values) {
  if (!source) return void 0;
  if (typeof source === "function") return source;
  const scale = resolveScaleInput(source.scale, {
    values,
    includeZero: true,
    nice: source.nice,
    niceCount: 5
  });
  return (value) => scale(value) ?? Number.NaN;
}
function inferScaleDomain(scale, values, includeZero = false) {
  const observed = values.filter(isChartValue);
  if (!observed.length) return void 0;
  if (typeof scale.bandwidth === "function" || typeof scale.ticks !== "function") {
    const domain = [];
    const seen = /* @__PURE__ */ new Set();
    for (const value of observed) {
      const key = value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      domain.push(value);
    }
    return domain;
  }
  const temporal = scale.domain().some((value) => value instanceof Date);
  if (temporal) {
    const dates = observed.filter(
      (value) => value instanceof Date
    );
    if (dates.length !== observed.length) {
      throw new TypeError(
        "A temporal scale factory requires Date channel values"
      );
    }
    let minimum2 = Infinity;
    let maximum2 = -Infinity;
    for (const value of dates) {
      const number = value.getTime();
      minimum2 = Math.min(minimum2, number);
      maximum2 = Math.max(maximum2, number);
    }
    if (!Number.isFinite(minimum2) || !Number.isFinite(maximum2)) {
      throw new TypeError(
        "A temporal scale factory requires Date channel values"
      );
    }
    if (minimum2 === maximum2) {
      const halfDay = 432e5;
      minimum2 -= halfDay;
      maximum2 += halfDay;
    }
    return [new Date(minimum2), new Date(maximum2)];
  }
  let minimum = Infinity;
  let maximum = -Infinity;
  for (const value of observed) {
    if (!isFiniteNumber(value)) {
      throw new TypeError(
        "A quantitative scale factory requires numeric values"
      );
    }
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) {
    throw new TypeError("A quantitative scale factory requires numeric values");
  }
  const logarithmic = isLogarithmicScale(scale);
  if (includeZero) {
    if (logarithmic) {
      throw new TypeError(
        "An inferred log scale cannot include an implicit zero baseline"
      );
    }
    minimum = Math.min(0, minimum);
    maximum = Math.max(0, maximum);
  }
  validateInferredLogDomain(scale, minimum, maximum);
  if (minimum === maximum) {
    if (minimum === 0) return [0, 1];
    const offset = Math.abs(minimum) * 0.05 || 1;
    minimum -= offset;
    maximum += offset;
  }
  return [minimum, maximum];
}
function isLogarithmicScale(scale) {
  return "base" in scale && typeof scale.base === "function";
}
function validateInferredLogDomain(scale, minimum, maximum) {
  if (isLogarithmicScale(scale) && (minimum === 0 || maximum === 0 || minimum < 0 && maximum > 0)) {
    throw new TypeError("An inferred log domain cannot include or cross zero");
  }
}
function applyScaleNice(scale, nice, defaultCount = 5) {
  if (!nice) return;
  const candidate = scale;
  if (typeof candidate.nice !== "function") {
    throw new TypeError("This scale does not support nicening");
  }
  candidate.nice(typeof nice === "number" ? nice : defaultCount);
}
export {
  isLogarithmicScale,
  isScaleFactory,
  resolveNumericScale,
  resolveScaleInput,
  validateInferredLogDomain
};
