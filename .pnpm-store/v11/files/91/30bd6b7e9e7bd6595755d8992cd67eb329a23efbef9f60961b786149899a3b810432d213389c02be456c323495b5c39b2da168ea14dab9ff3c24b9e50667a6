function whenFocused(mark, options = {}) {
  return {
    ...mark,
    initialize(context) {
      return {
        ...mark.initialize(context),
        focus: options
      };
    }
  };
}
export {
  whenFocused
};
