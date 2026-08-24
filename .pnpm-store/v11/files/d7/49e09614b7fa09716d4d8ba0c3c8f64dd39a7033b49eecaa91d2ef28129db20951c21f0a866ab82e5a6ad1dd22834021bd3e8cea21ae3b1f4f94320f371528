const defaultSpringOptions = {
  stiffness: 170,
  damping: 26,
  mass: 1,
  restSpeed: 0.01,
  restDelta: 5e-3
};
const defaultState = { from: 0, to: 1, velocity: 0 };
function createChartSpring(input = {}) {
  const options = Object.freeze(resolveSpringOptions(input));
  const sample = (elapsedMs, state = defaultState) => {
    if (elapsedMs === Number.POSITIVE_INFINITY) {
      return { value: finite(state.to, 1), velocity: 0, done: true };
    }
    const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
    return sampleSpring(options, elapsed / 1e3, state);
  };
  return { options, sample };
}
function sampleSpring(options, elapsed, state) {
  const from = finite(state.from, 0);
  const to = finite(state.to, 1);
  const initialVelocity = finite(state.velocity, 0);
  const displacement = from - to;
  if (Math.abs(displacement) <= options.restDelta && Math.abs(initialVelocity) <= options.restSpeed) {
    return { value: to, velocity: 0, done: true };
  }
  const omega = Math.sqrt(options.stiffness / options.mass);
  const dampingRatio = options.damping / (2 * Math.sqrt(options.stiffness * options.mass));
  let offset;
  let velocity;
  if (dampingRatio < 1 - 1e-7) {
    const decay = dampingRatio * omega;
    const frequency = omega * Math.sqrt(1 - dampingRatio * dampingRatio);
    const secondary = (initialVelocity + decay * displacement) / frequency;
    const cosine = Math.cos(frequency * elapsed);
    const sine = Math.sin(frequency * elapsed);
    const envelope = Math.exp(-decay * elapsed);
    offset = envelope * (displacement * cosine + secondary * sine);
    velocity = envelope * ((secondary * frequency - decay * displacement) * cosine + (-displacement * frequency - decay * secondary) * sine);
  } else if (dampingRatio > 1 + 1e-7) {
    const root = Math.sqrt(dampingRatio * dampingRatio - 1);
    const slow = -omega / (dampingRatio + root);
    const fast = -omega * (dampingRatio + root);
    const slowWeight = (initialVelocity - fast * displacement) / (slow - fast);
    const fastWeight = displacement - slowWeight;
    const slowEnvelope = Math.exp(slow * elapsed);
    const fastEnvelope = Math.exp(fast * elapsed);
    offset = slowWeight * slowEnvelope + fastWeight * fastEnvelope;
    velocity = slow * slowWeight * slowEnvelope + fast * fastWeight * fastEnvelope;
  } else {
    const secondary = initialVelocity + omega * displacement;
    const envelope = Math.exp(-omega * elapsed);
    offset = (displacement + secondary * elapsed) * envelope;
    velocity = (secondary - omega * (displacement + secondary * elapsed)) * envelope;
  }
  if (!Number.isFinite(offset) || !Number.isFinite(velocity)) {
    return { value: to, velocity: 0, done: true };
  }
  const done = Math.abs(offset) <= options.restDelta && Math.abs(velocity) <= options.restSpeed;
  return {
    value: done ? to : to + offset,
    velocity: done ? 0 : velocity,
    done
  };
}
function resolveSpringOptions(input) {
  return {
    stiffness: positive(input.stiffness, defaultSpringOptions.stiffness),
    damping: nonNegative(input.damping, defaultSpringOptions.damping),
    mass: positive(input.mass, defaultSpringOptions.mass),
    restSpeed: positive(input.restSpeed, defaultSpringOptions.restSpeed),
    restDelta: positive(input.restDelta, defaultSpringOptions.restDelta)
  };
}
function finite(value, fallback) {
  return value !== void 0 && Number.isFinite(value) ? value : fallback;
}
function positive(value, fallback) {
  const resolved = finite(value, fallback);
  return resolved > 0 ? resolved : fallback;
}
function nonNegative(value, fallback) {
  return Math.max(0, finite(value, fallback));
}
export {
  createChartSpring
};
