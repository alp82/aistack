import picomatch from "picomatch";
const matcher = (patterns, str) => {
  if (patterns.length === 0) {
    return false;
  }
  const matchers = patterns.map((pattern) => {
    if (typeof pattern === "string") {
      return picomatch(pattern);
    } else {
      return (s) => pattern.test(s);
    }
  });
  return matchers.some((isMatch) => isMatch(str));
};
export {
  matcher
};
//# sourceMappingURL=matcher.js.map
