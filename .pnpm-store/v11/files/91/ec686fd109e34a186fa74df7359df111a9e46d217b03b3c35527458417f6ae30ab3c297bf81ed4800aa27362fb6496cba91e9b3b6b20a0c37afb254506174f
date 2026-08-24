'use strict';

var React = require('react');
var THREE = require('three');
var traditional = require('zustand/traditional');
var suspendReact = require('suspend-react');
var Tb = require('scheduler');
var jsxRuntime = require('react/jsx-runtime');
var itsFine = require('its-fine');

function _interopDefault (e) { return e && e.__esModule ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);
var THREE__namespace = /*#__PURE__*/_interopNamespace(THREE);
var Tb__default = /*#__PURE__*/_interopDefault(Tb);

var threeTypes = /*#__PURE__*/Object.freeze({
  __proto__: null
});

/**
 * Returns the instance's initial (outmost) root.
 */
function findInitialRoot(instance) {
  let root = instance.root;
  while (root.getState().previousRoot) root = root.getState().previousRoot;
  return root;
}
/**
 * Safely flush async effects when testing, simulating a legacy root.
 * @deprecated Import from React instead. import { act } from 'react'
 */
// Reference with computed key to break Webpack static analysis
// https://github.com/webpack/webpack/issues/14814
const act = React__namespace['act' + ''];
const isOrthographicCamera = def => def && def.isOrthographicCamera;
const isRef = obj => obj && obj.hasOwnProperty('current');
const isColorRepresentation = value => value != null && (typeof value === 'string' || typeof value === 'number' || value.isColor);

/**
 * An SSR-friendly useLayoutEffect.
 *
 * React currently throws a warning when using useLayoutEffect on the server.
 * To get around it, we can conditionally useEffect on the server (no-op) and
 * useLayoutEffect elsewhere.
 *
 * @see https://github.com/facebook/react/issues/14927
 */
const useIsomorphicLayoutEffect = /* @__PURE__ */((_window$document, _window$navigator) => typeof window !== 'undefined' && (((_window$document = window.document) == null ? void 0 : _window$document.createElement) || ((_window$navigator = window.navigator) == null ? void 0 : _window$navigator.product) === 'ReactNative'))() ? React__namespace.useLayoutEffect : React__namespace.useEffect;
function useMutableCallback(fn) {
  const ref = React__namespace.useRef(fn);
  useIsomorphicLayoutEffect(() => void (ref.current = fn), [fn]);
  return ref;
}
/**
 * Bridges renderer Context and StrictMode from a primary renderer.
 */
function useBridge() {
  const fiber = itsFine.useFiber();
  const ContextBridge = itsFine.useContextBridge();
  return React__namespace.useMemo(() => ({
    children
  }) => {
    const strict = !!itsFine.traverseFiber(fiber, true, node => node.type === React__namespace.StrictMode);
    const Root = strict ? React__namespace.StrictMode : React__namespace.Fragment;
    return /*#__PURE__*/jsxRuntime.jsx(Root, {
      children: /*#__PURE__*/jsxRuntime.jsx(ContextBridge, {
        children: children
      })
    });
  }, [fiber, ContextBridge]);
}
function Block({
  set
}) {
  useIsomorphicLayoutEffect(() => {
    set(new Promise(() => null));
    return () => set(false);
  }, [set]);
  return null;
}

// NOTE: static members get down-level transpiled to mutations which break tree-shaking
const ErrorBoundary = /* @__PURE__ */(_ErrorBoundary => (_ErrorBoundary = class ErrorBoundary extends React__namespace.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      error: false
    };
  }
  componentDidCatch(err) {
    this.props.set(err);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}, _ErrorBoundary.getDerivedStateFromError = () => ({
  error: true
}), _ErrorBoundary))();
function calculateDpr(dpr) {
  var _window$devicePixelRa;
  // Err on the side of progress by assuming 2x dpr if we can't detect it
  // This will happen in workers where window is defined but dpr isn't.
  const target = typeof window !== 'undefined' ? (_window$devicePixelRa = window.devicePixelRatio) != null ? _window$devicePixelRa : 2 : 1;
  return Array.isArray(dpr) ? Math.min(Math.max(dpr[0], target), dpr[1]) : dpr;
}

/**
 * Returns instance root state
 */
function getRootState(obj) {
  var _r3f;
  return (_r3f = obj.__r3f) == null ? void 0 : _r3f.root.getState();
}
// A collection of compare functions
const is = {
  obj: a => a === Object(a) && !is.arr(a) && typeof a !== 'function',
  fun: a => typeof a === 'function',
  str: a => typeof a === 'string',
  num: a => typeof a === 'number',
  boo: a => typeof a === 'boolean',
  und: a => a === void 0,
  nul: a => a === null,
  arr: a => Array.isArray(a),
  equ(a, b, {
    arrays = 'shallow',
    objects = 'reference',
    strict = true
  } = {}) {
    // Wrong type or one of the two undefined, doesn't match
    if (typeof a !== typeof b || !!a !== !!b) return false;
    // Atomic, just compare a against b
    if (is.str(a) || is.num(a) || is.boo(a)) return a === b;
    const isObj = is.obj(a);
    if (isObj && objects === 'reference') return a === b;
    const isArr = is.arr(a);
    if (isArr && arrays === 'reference') return a === b;
    // Array or Object, shallow compare first to see if it's a match
    if ((isArr || isObj) && a === b) return true;
    // Last resort, go through keys
    let i;
    // Check if a has all the keys of b
    for (i in a) if (!(i in b)) return false;
    // Check if values between keys match
    if (isObj && arrays === 'shallow' && objects === 'shallow') {
      for (i in strict ? b : a) if (!is.equ(a[i], b[i], {
        strict,
        objects: 'reference'
      })) return false;
    } else {
      for (i in strict ? b : a) if (a[i] !== b[i]) return false;
    }
    // If i is undefined
    if (is.und(i)) {
      // If both arrays are empty we consider them equal
      if (isArr && a.length === 0 && b.length === 0) return true;
      // If both objects are empty we consider them equal
      if (isObj && Object.keys(a).length === 0 && Object.keys(b).length === 0) return true;
      // Otherwise match them by value
      if (a !== b) return false;
    }
    return true;
  }
};

// Collects nodes and materials from a THREE.Object3D
function buildGraph(object) {
  const data = {
    nodes: {},
    materials: {},
    meshes: {}
  };
  if (object) {
    object.traverse(obj => {
      if (obj.name) data.nodes[obj.name] = obj;
      if (obj.material && !data.materials[obj.material.name]) data.materials[obj.material.name] = obj.material;
      if (obj.isMesh && !data.meshes[obj.name]) data.meshes[obj.name] = obj;
    });
  }
  return data;
}
// Disposes an object and all its properties
function dispose(obj) {
  if (obj.type !== 'Scene') obj.dispose == null ? void 0 : obj.dispose();
  for (const p in obj) {
    const prop = obj[p];
    if ((prop == null ? void 0 : prop.type) !== 'Scene') prop == null ? void 0 : prop.dispose == null ? void 0 : prop.dispose();
  }
}
const REACT_INTERNAL_PROPS = ['children', 'key', 'ref'];

// Gets only instance props from reconciler fibers
function getInstanceProps(pendingProps) {
  const props = {};
  for (const key in pendingProps) {
    if (!REACT_INTERNAL_PROPS.includes(key)) props[key] = pendingProps[key];
  }
  return props;
}

// Each object in the scene carries a small LocalState descriptor
function prepare(target, root, type, props) {
  const object = target;

  // Create instance descriptor
  let instance = object == null ? void 0 : object.__r3f;
  if (!instance) {
    instance = {
      root,
      type,
      parent: null,
      children: [],
      props: getInstanceProps(props),
      object,
      eventCount: 0,
      handlers: {},
      isHidden: false
    };
    if (object) object.__r3f = instance;
  }
  return instance;
}
function resolve(root, key) {
  if (!key.includes('-')) return {
    root,
    key,
    target: root[key]
  };

  // First try the entire key as a single property (e.g., 'foo-bar')
  if (key in root) {
    return {
      root,
      key,
      target: root[key]
    };
  }

  // Try piercing (e.g., 'material-color' -> material.color)
  let target = root;
  const parts = key.split('-');
  for (const part of parts) {
    if (typeof target !== 'object' || target === null) {
      if (target !== undefined) {
        // Property exists but has unexpected shape
        const remaining = parts.slice(parts.indexOf(part)).join('-');
        return {
          root: target,
          key: remaining,
          target: undefined
        };
      }
      // Property doesn't exist - fallback to original key
      return {
        root,
        key,
        target: undefined
      };
    }
    key = part;
    root = target;
    target = target[key];
  }
  return {
    root,
    key,
    target
  };
}

// Checks if a dash-cased string ends with an integer
const INDEX_REGEX = /-\d+$/;
function attach(parent, child) {
  if (is.str(child.props.attach)) {
    // If attaching into an array (foo-0), create one
    if (INDEX_REGEX.test(child.props.attach)) {
      const index = child.props.attach.replace(INDEX_REGEX, '');
      const {
        root,
        key
      } = resolve(parent.object, index);
      if (!Array.isArray(root[key])) root[key] = [];
    }
    const {
      root,
      key
    } = resolve(parent.object, child.props.attach);
    child.previousAttach = root[key];
    root[key] = child.object;
  } else if (is.fun(child.props.attach)) {
    child.previousAttach = child.props.attach(parent.object, child.object);
  }
}
function detach(parent, child) {
  if (is.str(child.props.attach)) {
    const {
      root,
      key
    } = resolve(parent.object, child.props.attach);
    const previous = child.previousAttach;
    // When the previous value was undefined, it means the value was never set to begin with
    if (previous === undefined) delete root[key];
    // Otherwise set the previous value
    else root[key] = previous;
  } else {
    child.previousAttach == null ? void 0 : child.previousAttach(parent.object, child.object);
  }
  delete child.previousAttach;
}
const RESERVED_PROPS = [...REACT_INTERNAL_PROPS,
// Instance props
'args', 'dispose', 'attach', 'object', 'onUpdate',
// Behavior flags
'dispose'];
const MEMOIZED_PROTOTYPES = new Map();
function getMemoizedPrototype(root) {
  let ctor = MEMOIZED_PROTOTYPES.get(root.constructor);
  try {
    if (!ctor) {
      ctor = new root.constructor();
      MEMOIZED_PROTOTYPES.set(root.constructor, ctor);
    }
  } catch (e) {
    // ...
  }
  return ctor;
}

// This function prepares a set of changes to be applied to the instance
function diffProps(instance, newProps) {
  const changedProps = {};

  // Sort through props
  for (const prop in newProps) {
    // Skip reserved keys
    if (RESERVED_PROPS.includes(prop)) continue;
    // Skip if props match
    if (is.equ(newProps[prop], instance.props[prop])) continue;

    // Props changed, add them
    changedProps[prop] = newProps[prop];

    // Reset pierced props
    for (const other in newProps) {
      if (other.startsWith(`${prop}-`)) changedProps[other] = newProps[other];
    }
  }

  // Reset removed props for HMR
  for (const prop in instance.props) {
    if (RESERVED_PROPS.includes(prop) || newProps.hasOwnProperty(prop)) continue;
    const {
      root,
      key
    } = resolve(instance.object, prop);

    // https://github.com/mrdoob/three.js/issues/21209
    // HMR/fast-refresh relies on the ability to cancel out props, but threejs
    // has no means to do this. Hence we curate a small collection of value-classes
    // with their respective constructor/set arguments
    // For removed props, try to set default values, if possible
    if (root.constructor && root.constructor.length === 0) {
      // create a blank slate of the instance and copy the particular parameter.
      const ctor = getMemoizedPrototype(root);
      if (!is.und(ctor)) changedProps[key] = ctor[key];
    } else {
      // instance does not have constructor, just set it to 0
      changedProps[key] = 0;
    }
  }
  return changedProps;
}

// https://github.com/mrdoob/three.js/pull/27042
// https://github.com/mrdoob/three.js/pull/22748
const colorMaps = ['map', 'emissiveMap', 'sheenColorMap', 'specularColorMap', 'envMap'];
const EVENT_REGEX = /^on(Pointer|Click|DoubleClick|ContextMenu|Wheel)/;
// This function applies a set of changes to the instance
function applyProps(object, props) {
  var _instance$object;
  const instance = object.__r3f;
  const rootState = instance && findInitialRoot(instance).getState();
  const prevHandlers = instance == null ? void 0 : instance.eventCount;
  for (const prop in props) {
    let value = props[prop];

    // Don't mutate reserved keys
    if (RESERVED_PROPS.includes(prop)) continue;

    // Deal with pointer events, including removing them if undefined
    if (instance && EVENT_REGEX.test(prop)) {
      if (typeof value === 'function') instance.handlers[prop] = value;else delete instance.handlers[prop];
      instance.eventCount = Object.keys(instance.handlers).length;
      continue;
    }

    // Ignore setting undefined props
    // https://github.com/pmndrs/react-three-fiber/issues/274
    if (value === undefined) continue;
    let {
      root,
      key,
      target
    } = resolve(object, prop);

    // Throw an error if we attempted to set a pierced prop to a non-object
    if (target === undefined && (typeof root !== 'object' || root === null)) {
      throw Error(`R3F: Cannot set "${prop}". Ensure it is an object before setting "${key}".`);
    }

    // Layers must be written to the mask property
    if (target instanceof THREE__namespace.Layers && value instanceof THREE__namespace.Layers) {
      target.mask = value.mask;
    }
    // Set colors if valid color representation for automatic conversion (copy)
    else if (target instanceof THREE__namespace.Color && isColorRepresentation(value)) {
      target.set(value);
    }
    // Copy if properties match signatures and implement math interface (likely read-only)
    else if (target !== null && typeof target === 'object' && typeof target.set === 'function' && typeof target.copy === 'function' && value != null && value.constructor && target.constructor === value.constructor) {
      target.copy(value);
    }
    // Set array types
    else if (target !== null && typeof target === 'object' && typeof target.set === 'function' && Array.isArray(value)) {
      if (typeof target.fromArray === 'function') target.fromArray(value);else target.set(...value);
    }
    // Set literal types
    else if (target !== null && typeof target === 'object' && typeof target.set === 'function' && typeof value === 'number') {
      // Allow setting array scalars
      if (typeof target.setScalar === 'function') target.setScalar(value);
      // Otherwise just set single value
      else target.set(value);
    }
    // Else, just overwrite the value
    else {
      var _root$key;
      root[key] = value;

      // Auto-convert sRGB texture parameters for built-in materials
      // https://github.com/pmndrs/react-three-fiber/issues/344
      // https://github.com/mrdoob/three.js/pull/25857
      if (rootState && !rootState.linear && colorMaps.includes(key) && (_root$key = root[key]) != null && _root$key.isTexture &&
      // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
      root[key].format === THREE__namespace.RGBAFormat && root[key].type === THREE__namespace.UnsignedByteType) {
        // NOTE: this cannot be set from the renderer (e.g. sRGB source textures rendered to P3)
        root[key].colorSpace = THREE__namespace.SRGBColorSpace;
      }
    }
  }

  // Register event handlers
  if (instance != null && instance.parent && rootState != null && rootState.internal && (_instance$object = instance.object) != null && _instance$object.isObject3D && prevHandlers !== instance.eventCount) {
    const object = instance.object;
    // Pre-emptively remove the instance from the interaction manager
    const index = rootState.internal.interaction.indexOf(object);
    if (index > -1) rootState.internal.interaction.splice(index, 1);
    // Add the instance to the interaction manager only when it has handlers
    if (instance.eventCount && object.raycast !== null) {
      rootState.internal.interaction.push(object);
    }
  }

  // Auto-attach geometries and materials
  if (instance && instance.props.attach === undefined) {
    if (instance.object.isBufferGeometry) instance.props.attach = 'geometry';else if (instance.object.isMaterial) instance.props.attach = 'material';
  }

  // Instance was updated, request a frame
  if (instance) invalidateInstance(instance);
  return object;
}
function invalidateInstance(instance) {
  var _instance$root;
  if (!instance.parent) return;
  instance.props.onUpdate == null ? void 0 : instance.props.onUpdate(instance.object);
  const state = (_instance$root = instance.root) == null ? void 0 : _instance$root.getState == null ? void 0 : _instance$root.getState();
  if (state && state.internal.frames === 0) state.invalidate();
}
function updateCamera(camera, size) {
  // Do not mess with the camera if it belongs to the user
  // https://github.com/pmndrs/react-three-fiber/issues/92
  if (camera.manual) return;
  if (isOrthographicCamera(camera)) {
    camera.left = size.width / -2;
    camera.right = size.width / 2;
    camera.top = size.height / 2;
    camera.bottom = size.height / -2;
  } else {
    camera.aspect = size.width / size.height;
  }
  camera.updateProjectionMatrix();
}
const isObject3D = object => object == null ? void 0 : object.isObject3D;

function makeId(event) {
  return (event.eventObject || event.object).uuid + '/' + event.index + event.instanceId;
}

/**
 * Release pointer captures.
 * This is called by releasePointerCapture in the API, and when an object is removed.
 */
function releaseInternalPointerCapture(capturedMap, obj, captures, pointerId) {
  const captureData = captures.get(obj);
  if (captureData) {
    captures.delete(obj);
    // If this was the last capturing object for this pointer
    if (captures.size === 0) {
      capturedMap.delete(pointerId);
      captureData.target.releasePointerCapture(pointerId);
    }
  }
}
function removeInteractivity(store, object) {
  const {
    internal
  } = store.getState();
  // Removes every trace of an object from the data store
  internal.interaction = internal.interaction.filter(o => o !== object);
  internal.initialHits = internal.initialHits.filter(o => o !== object);
  internal.hovered.forEach((value, key) => {
    if (value.eventObject === object || value.object === object) {
      // Clear out intersects, they are outdated by now
      internal.hovered.delete(key);
    }
  });
  internal.capturedMap.forEach((captures, pointerId) => {
    releaseInternalPointerCapture(internal.capturedMap, object, captures, pointerId);
  });
}
function createEvents(store) {
  /** Calculates delta */
  function calculateDistance(event) {
    const {
      internal
    } = store.getState();
    const dx = event.offsetX - internal.initialClick[0];
    const dy = event.offsetY - internal.initialClick[1];
    return Math.round(Math.sqrt(dx * dx + dy * dy));
  }

  /** Returns true if an instance has a valid pointer-event registered, this excludes scroll, clicks etc */
  function filterPointerEvents(objects) {
    return objects.filter(obj => ['Move', 'Over', 'Enter', 'Out', 'Leave'].some(name => {
      var _r3f;
      return (_r3f = obj.__r3f) == null ? void 0 : _r3f.handlers['onPointer' + name];
    }));
  }
  function intersect(event, filter) {
    const state = store.getState();
    const duplicates = new Set();
    const intersections = [];
    // Allow callers to eliminate event objects
    const eventsObjects = filter ? filter(state.internal.interaction) : state.internal.interaction;
    // Reset all raycaster cameras to undefined
    for (let i = 0; i < eventsObjects.length; i++) {
      const state = getRootState(eventsObjects[i]);
      if (state) {
        state.raycaster.camera = undefined;
      }
    }
    if (!state.previousRoot) {
      // Make sure root-level pointer and ray are set up
      state.events.compute == null ? void 0 : state.events.compute(event, state);
    }
    function handleRaycast(obj) {
      const state = getRootState(obj);
      // Skip event handling when noEvents is set, or when the raycasters camera is null
      if (!state || !state.events.enabled || state.raycaster.camera === null) return [];

      // When the camera is undefined we have to call the event layers update function
      if (state.raycaster.camera === undefined) {
        var _state$previousRoot;
        state.events.compute == null ? void 0 : state.events.compute(event, state, (_state$previousRoot = state.previousRoot) == null ? void 0 : _state$previousRoot.getState());
        // If the camera is still undefined we have to skip this layer entirely
        if (state.raycaster.camera === undefined) state.raycaster.camera = null;
      }

      // Intersect object by object
      return state.raycaster.camera ? state.raycaster.intersectObject(obj, true) : [];
    }

    // Collect events
    let hits = eventsObjects
    // Intersect objects
    .flatMap(handleRaycast)
    // Sort by event priority and distance
    .sort((a, b) => {
      const aState = getRootState(a.object);
      const bState = getRootState(b.object);
      if (!aState || !bState) return a.distance - b.distance;
      return bState.events.priority - aState.events.priority || a.distance - b.distance;
    })
    // Filter out duplicates
    .filter(item => {
      const id = makeId(item);
      if (duplicates.has(id)) return false;
      duplicates.add(id);
      return true;
    });

    // https://github.com/mrdoob/three.js/issues/16031
    // Allow custom userland intersect sort order, this likely only makes sense on the root filter
    if (state.events.filter) hits = state.events.filter(hits, state);

    // Bubble up the events, find the event source (eventObject)
    for (const hit of hits) {
      let eventObject = hit.object;
      // Bubble event up
      while (eventObject) {
        var _r3f2;
        if ((_r3f2 = eventObject.__r3f) != null && _r3f2.eventCount) intersections.push({
          ...hit,
          eventObject
        });
        eventObject = eventObject.parent;
      }
    }

    // If the interaction is captured, make all capturing targets part of the intersect.
    if ('pointerId' in event && state.internal.capturedMap.has(event.pointerId)) {
      for (let captureData of state.internal.capturedMap.get(event.pointerId).values()) {
        if (!duplicates.has(makeId(captureData.intersection))) intersections.push(captureData.intersection);
      }
    }
    return intersections;
  }

  /**  Handles intersections by forwarding them to handlers */
  function handleIntersects(intersections, event, delta, callback) {
    // If anything has been found, forward it to the event listeners
    if (intersections.length) {
      const localState = {
        stopped: false
      };
      for (const hit of intersections) {
        let state = getRootState(hit.object);

        // If the object is not managed by R3F, it might be parented to an element which is.
        // Traverse upwards until we find a managed parent and use its state instead.
        if (!state) {
          hit.object.traverseAncestors(obj => {
            const parentState = getRootState(obj);
            if (parentState) {
              state = parentState;
              return false;
            }
          });
        }
        if (state) {
          const {
            raycaster,
            pointer,
            camera,
            internal
          } = state;
          const unprojectedPoint = new THREE__namespace.Vector3(pointer.x, pointer.y, 0).unproject(camera);
          const hasPointerCapture = id => {
            var _internal$capturedMap, _internal$capturedMap2;
            return (_internal$capturedMap = (_internal$capturedMap2 = internal.capturedMap.get(id)) == null ? void 0 : _internal$capturedMap2.has(hit.eventObject)) != null ? _internal$capturedMap : false;
          };
          const setPointerCapture = id => {
            const captureData = {
              intersection: hit,
              target: event.target
            };
            if (internal.capturedMap.has(id)) {
              // if the pointerId was previously captured, we add the hit to the
              // event capturedMap.
              internal.capturedMap.get(id).set(hit.eventObject, captureData);
            } else {
              // if the pointerId was not previously captured, we create a map
              // containing the hitObject, and the hit. hitObject is used for
              // faster access.
              internal.capturedMap.set(id, new Map([[hit.eventObject, captureData]]));
            }
            event.target.setPointerCapture(id);
          };
          const releasePointerCapture = id => {
            const captures = internal.capturedMap.get(id);
            if (captures) {
              releaseInternalPointerCapture(internal.capturedMap, hit.eventObject, captures, id);
            }
          };

          // Add native event props
          let extractEventProps = {};
          // This iterates over the event's properties including the inherited ones. Native PointerEvents have most of their props as getters which are inherited, but polyfilled PointerEvents have them all as their own properties (i.e. not inherited). We can't use Object.keys() or Object.entries() as they only return "own" properties; nor Object.getPrototypeOf(event) as that *doesn't* return "own" properties, only inherited ones.
          for (let prop in event) {
            let property = event[prop];
            // Only copy over atomics, leave functions alone as these should be
            // called as event.nativeEvent.fn()
            if (typeof property !== 'function') extractEventProps[prop] = property;
          }
          let raycastEvent = {
            ...hit,
            ...extractEventProps,
            pointer,
            intersections,
            stopped: localState.stopped,
            delta,
            unprojectedPoint,
            ray: raycaster.ray,
            camera: camera,
            // Hijack stopPropagation, which just sets a flag
            stopPropagation() {
              // https://github.com/pmndrs/react-three-fiber/issues/596
              // Events are not allowed to stop propagation if the pointer has been captured
              const capturesForPointer = 'pointerId' in event && internal.capturedMap.get(event.pointerId);

              // We only authorize stopPropagation...
              if (
              // ...if this pointer hasn't been captured
              !capturesForPointer ||
              // ... or if the hit object is capturing the pointer
              capturesForPointer.has(hit.eventObject)) {
                raycastEvent.stopped = localState.stopped = true;
                // Propagation is stopped, remove all other hover records
                // An event handler is only allowed to flush other handlers if it is hovered itself
                if (internal.hovered.size && Array.from(internal.hovered.values()).find(i => i.eventObject === hit.eventObject)) {
                  // Objects cannot flush out higher up objects that have already caught the event
                  const higher = intersections.slice(0, intersections.indexOf(hit));
                  cancelPointer([...higher, hit]);
                }
              }
            },
            // there should be a distinction between target and currentTarget
            target: {
              hasPointerCapture,
              setPointerCapture,
              releasePointerCapture
            },
            currentTarget: {
              hasPointerCapture,
              setPointerCapture,
              releasePointerCapture
            },
            nativeEvent: event
          };

          // Call subscribers
          callback(raycastEvent);
          // Event bubbling may be interrupted by stopPropagation
          if (localState.stopped === true) break;
        }
      }
    }
    return intersections;
  }
  function cancelPointer(intersections) {
    const {
      internal
    } = store.getState();
    for (const hoveredObj of internal.hovered.values()) {
      // When no objects were hit or the the hovered object wasn't found underneath the cursor
      // we call onPointerOut and delete the object from the hovered-elements map
      if (!intersections.length || !intersections.find(hit => hit.object === hoveredObj.object && hit.index === hoveredObj.index && hit.instanceId === hoveredObj.instanceId)) {
        const eventObject = hoveredObj.eventObject;
        const instance = eventObject.__r3f;
        internal.hovered.delete(makeId(hoveredObj));
        if (instance != null && instance.eventCount) {
          const handlers = instance.handlers;
          // Clear out intersects, they are outdated by now
          const data = {
            ...hoveredObj,
            intersections
          };
          handlers.onPointerOut == null ? void 0 : handlers.onPointerOut(data);
          handlers.onPointerLeave == null ? void 0 : handlers.onPointerLeave(data);
        }
      }
    }
  }
  function pointerMissed(event, objects) {
    for (let i = 0; i < objects.length; i++) {
      const instance = objects[i].__r3f;
      instance == null ? void 0 : instance.handlers.onPointerMissed == null ? void 0 : instance.handlers.onPointerMissed(event);
    }
  }
  function handlePointer(name) {
    // Deal with cancelation
    switch (name) {
      case 'onPointerLeave':
      case 'onPointerCancel':
        return () => cancelPointer([]);
      case 'onLostPointerCapture':
        return event => {
          const {
            internal
          } = store.getState();
          if ('pointerId' in event && internal.capturedMap.has(event.pointerId)) {
            // If the object event interface had onLostPointerCapture, we'd call it here on every
            // object that's getting removed. We call it on the next frame because onLostPointerCapture
            // fires before onPointerUp. Otherwise pointerUp would never be called if the event didn't
            // happen in the object it originated from, leaving components in a in-between state.
            requestAnimationFrame(() => {
              // Only release if pointer-up didn't do it already
              if (internal.capturedMap.has(event.pointerId)) {
                internal.capturedMap.delete(event.pointerId);
                cancelPointer([]);
              }
            });
          }
        };
    }

    // Any other pointer goes here ...
    return function handleEvent(event) {
      const {
        onPointerMissed,
        internal
      } = store.getState();

      // prepareRay(event)
      internal.lastEvent.current = event;

      // Get fresh intersects
      const isPointerMove = name === 'onPointerMove';
      const isClickEvent = name === 'onClick' || name === 'onContextMenu' || name === 'onDoubleClick';
      const filter = isPointerMove ? filterPointerEvents : undefined;
      const hits = intersect(event, filter);
      const delta = isClickEvent ? calculateDistance(event) : 0;

      // Save initial coordinates on pointer-down
      if (name === 'onPointerDown') {
        internal.initialClick = [event.offsetX, event.offsetY];
        internal.initialHits = hits.map(hit => hit.eventObject);
      }

      // If a click yields no results, pass it back to the user as a miss
      // Missed events have to come first in order to establish user-land side-effect clean up
      if (isClickEvent && !hits.length) {
        if (delta <= 2) {
          pointerMissed(event, internal.interaction);
          if (onPointerMissed) onPointerMissed(event);
        }
      }
      // Take care of unhover
      if (isPointerMove) cancelPointer(hits);
      function onIntersect(data) {
        const eventObject = data.eventObject;
        const instance = eventObject.__r3f;

        // Check presence of handlers
        if (!(instance != null && instance.eventCount)) return;
        const handlers = instance.handlers;

        /*
        MAYBE TODO, DELETE IF NOT: 
          Check if the object is captured, captured events should not have intersects running in parallel
          But wouldn't it be better to just replace capturedMap with a single entry?
          Also, are we OK with straight up making picking up multiple objects impossible?
          
        const pointerId = (data as ThreeEvent<PointerEvent>).pointerId        
        if (pointerId !== undefined) {
          const capturedMeshSet = internal.capturedMap.get(pointerId)
          if (capturedMeshSet) {
            const captured = capturedMeshSet.get(eventObject)
            if (captured && captured.localState.stopped) return
          }
        }*/

        if (isPointerMove) {
          // Move event ...
          if (handlers.onPointerOver || handlers.onPointerEnter || handlers.onPointerOut || handlers.onPointerLeave) {
            // When enter or out is present take care of hover-state
            const id = makeId(data);
            const hoveredItem = internal.hovered.get(id);
            if (!hoveredItem) {
              // If the object wasn't previously hovered, book it and call its handler
              internal.hovered.set(id, data);
              handlers.onPointerOver == null ? void 0 : handlers.onPointerOver(data);
              handlers.onPointerEnter == null ? void 0 : handlers.onPointerEnter(data);
            } else if (hoveredItem.stopped) {
              // If the object was previously hovered and stopped, we shouldn't allow other items to proceed
              data.stopPropagation();
            }
          }
          // Call mouse move
          handlers.onPointerMove == null ? void 0 : handlers.onPointerMove(data);
        } else {
          // All other events ...
          const handler = handlers[name];
          if (handler) {
            // Forward all events back to their respective handlers with the exception of click events,
            // which must use the initial target
            if (!isClickEvent || internal.initialHits.includes(eventObject)) {
              // Missed events have to come first
              pointerMissed(event, internal.interaction.filter(object => !internal.initialHits.includes(object)));
              // Now call the handler
              handler(data);
            }
          } else {
            // Trigger onPointerMissed on all elements that have pointer over/out handlers, but not click and weren't hit
            if (isClickEvent && internal.initialHits.includes(eventObject)) {
              pointerMissed(event, internal.interaction.filter(object => !internal.initialHits.includes(object)));
            }
          }
        }
      }
      handleIntersects(hits, event, delta, onIntersect);
    };
  }
  return {
    handlePointer
  };
}

const isRenderer = def => !!(def != null && def.render);
const context = /* @__PURE__ */React__namespace.createContext(null);
const createStore = (invalidate, advance) => {
  const rootStore = traditional.createWithEqualityFn((set, get) => {
    const position = new THREE__namespace.Vector3();
    const defaultTarget = new THREE__namespace.Vector3();
    const tempTarget = new THREE__namespace.Vector3();
    function getCurrentViewport(camera = get().camera, target = defaultTarget, size = get().size) {
      const {
        width,
        height,
        top,
        left
      } = size;
      const aspect = width / height;
      if (target.isVector3) tempTarget.copy(target);else tempTarget.set(...target);
      const distance = camera.getWorldPosition(position).distanceTo(tempTarget);
      if (isOrthographicCamera(camera)) {
        return {
          width: width / camera.zoom,
          height: height / camera.zoom,
          top,
          left,
          factor: 1,
          distance,
          aspect
        };
      } else {
        const fov = camera.fov * Math.PI / 180; // convert vertical fov to radians
        const h = 2 * Math.tan(fov / 2) * distance; // visible height
        const w = h * (width / height);
        return {
          width: w,
          height: h,
          top,
          left,
          factor: width / w,
          distance,
          aspect
        };
      }
    }
    let performanceTimeout = undefined;
    const setPerformanceCurrent = current => set(state => ({
      performance: {
        ...state.performance,
        current
      }
    }));
    const pointer = new THREE__namespace.Vector2();
    const rootState = {
      set,
      get,
      // Mock objects that have to be configured
      gl: null,
      camera: null,
      raycaster: null,
      events: {
        priority: 1,
        enabled: true,
        connected: false
      },
      scene: null,
      xr: null,
      invalidate: (frames = 1) => invalidate(get(), frames),
      advance: (timestamp, runGlobalEffects) => advance(timestamp, runGlobalEffects, get()),
      legacy: false,
      linear: false,
      flat: false,
      controls: null,
      clock: new THREE__namespace.Clock(),
      pointer,
      mouse: pointer,
      frameloop: 'always',
      onPointerMissed: undefined,
      performance: {
        current: 1,
        min: 0.5,
        max: 1,
        debounce: 200,
        regress: () => {
          const state = get();
          // Clear timeout
          if (performanceTimeout) clearTimeout(performanceTimeout);
          // Set lower bound performance
          if (state.performance.current !== state.performance.min) setPerformanceCurrent(state.performance.min);
          // Go back to upper bound performance after a while unless something regresses meanwhile
          performanceTimeout = setTimeout(() => setPerformanceCurrent(get().performance.max), state.performance.debounce);
        }
      },
      size: {
        width: 0,
        height: 0,
        top: 0,
        left: 0
      },
      viewport: {
        initialDpr: 0,
        dpr: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        aspect: 0,
        distance: 0,
        factor: 0,
        getCurrentViewport
      },
      setEvents: events => set(state => ({
        ...state,
        events: {
          ...state.events,
          ...events
        }
      })),
      setSize: (width, height, top = 0, left = 0) => {
        const camera = get().camera;
        const size = {
          width,
          height,
          top,
          left
        };
        set(state => ({
          size,
          viewport: {
            ...state.viewport,
            ...getCurrentViewport(camera, defaultTarget, size)
          }
        }));
      },
      setDpr: dpr => set(state => {
        const resolved = calculateDpr(dpr);
        return {
          viewport: {
            ...state.viewport,
            dpr: resolved,
            initialDpr: state.viewport.initialDpr || resolved
          }
        };
      }),
      setFrameloop: (frameloop = 'always') => {
        const clock = get().clock;

        // if frameloop === "never" clock.elapsedTime is updated using advance(timestamp)
        clock.stop();
        clock.elapsedTime = 0;
        if (frameloop !== 'never') {
          clock.start();
          clock.elapsedTime = 0;
        }
        set(() => ({
          frameloop
        }));
      },
      previousRoot: undefined,
      internal: {
        // Events
        interaction: [],
        hovered: new Map(),
        subscribers: [],
        initialClick: [0, 0],
        initialHits: [],
        capturedMap: new Map(),
        lastEvent: /*#__PURE__*/React__namespace.createRef(),
        // Updates
        active: false,
        frames: 0,
        priority: 0,
        subscribe: (ref, priority, store) => {
          const internal = get().internal;
          // If this subscription was given a priority, it takes rendering into its own hands
          // For that reason we switch off automatic rendering and increase the manual flag
          // As long as this flag is positive there can be no internal rendering at all
          // because there could be multiple render subscriptions
          internal.priority = internal.priority + (priority > 0 ? 1 : 0);
          internal.subscribers.push({
            ref,
            priority,
            store
          });
          // Register subscriber and sort layers from lowest to highest, meaning,
          // highest priority renders last (on top of the other frames)
          internal.subscribers = internal.subscribers.sort((a, b) => a.priority - b.priority);
          return () => {
            const internal = get().internal;
            if (internal != null && internal.subscribers) {
              // Decrease manual flag if this subscription had a priority
              internal.priority = internal.priority - (priority > 0 ? 1 : 0);
              // Remove subscriber from list
              internal.subscribers = internal.subscribers.filter(s => s.ref !== ref);
            }
          };
        }
      }
    };
    return rootState;
  });
  const state = rootStore.getState();
  let oldSize = state.size;
  let oldDpr = state.viewport.dpr;
  let oldCamera = state.camera;
  rootStore.subscribe(() => {
    const {
      camera,
      size,
      viewport,
      gl,
      set
    } = rootStore.getState();

    // Resize camera and renderer on changes to size and pixelratio
    if (size.width !== oldSize.width || size.height !== oldSize.height || viewport.dpr !== oldDpr) {
      oldSize = size;
      oldDpr = viewport.dpr;
      // Update camera & renderer
      updateCamera(camera, size);
      if (viewport.dpr > 0) gl.setPixelRatio(viewport.dpr);
      const updateStyle = typeof HTMLCanvasElement !== 'undefined' && gl.domElement instanceof HTMLCanvasElement;
      gl.setSize(size.width, size.height, updateStyle);
    }

    // Update viewport once the camera changes
    if (camera !== oldCamera) {
      oldCamera = camera;
      // Update viewport
      set(state => ({
        viewport: {
          ...state.viewport,
          ...state.viewport.getCurrentViewport(camera)
        }
      }));
    }
  });

  // Invalidate on any change
  rootStore.subscribe(state => invalidate(state));

  // Return root state
  return rootStore;
};

/**
 * Exposes an object's {@link Instance}.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#useInstanceHandle
 *
 * **Note**: this is an escape hatch to react-internal fields. Expect this to change significantly between versions.
 */
function useInstanceHandle(ref) {
  const instance = React__namespace.useRef(null);
  React__namespace.useImperativeHandle(instance, () => ref.current.__r3f, [ref]);
  return instance;
}

/**
 * Returns the R3F Canvas' Zustand store. Useful for [transient updates](https://github.com/pmndrs/zustand#transient-updates-for-often-occurring-state-changes).
 * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#usestore
 */
function useStore() {
  const store = React__namespace.useContext(context);
  if (!store) throw new Error('R3F: Hooks can only be used within the Canvas component!');
  return store;
}

/**
 * Accesses R3F's internal state, containing renderer, canvas, scene, etc.
 * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#usethree
 */
function useThree(selector = state => state, equalityFn) {
  return useStore()(selector, equalityFn);
}

/**
 * Executes a callback before render in a shared frame loop.
 * Can order effects with render priority or manually render with a positive priority.
 * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#useframe
 */
function useFrame(callback, renderPriority = 0) {
  const store = useStore();
  const subscribe = store.getState().internal.subscribe;
  // Memoize ref
  const ref = useMutableCallback(callback);
  // Subscribe on mount, unsubscribe on unmount
  useIsomorphicLayoutEffect(() => subscribe(ref, renderPriority, store), [renderPriority, subscribe, store]);
  return null;
}

/**
 * Returns a node graph of an object with named nodes & materials.
 * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#usegraph
 */
function useGraph(object) {
  return React__namespace.useMemo(() => buildGraph(object), [object]);
}
const memoizedLoaders = new WeakMap();
const isConstructor$1 = value => {
  var _value$prototype;
  return typeof value === 'function' && (value == null ? void 0 : (_value$prototype = value.prototype) == null ? void 0 : _value$prototype.constructor) === value;
};
function loadingFn(extensions, onProgress) {
  return function (Proto, ...input) {
    let loader;

    // Construct and cache loader if constructor was passed
    if (isConstructor$1(Proto)) {
      loader = memoizedLoaders.get(Proto);
      if (!loader) {
        loader = new Proto();
        memoizedLoaders.set(Proto, loader);
      }
    } else {
      loader = Proto;
    }

    // Apply loader extensions
    if (extensions) extensions(loader);

    // Go through the urls and load them
    return Promise.all(input.map(input => new Promise((res, reject) => loader.load(input, data => {
      if (isObject3D(data == null ? void 0 : data.scene)) Object.assign(data, buildGraph(data.scene));
      res(data);
    }, onProgress, error => reject(new Error(`Could not load ${input}: ${error == null ? void 0 : error.message}`))))));
  };
}

/**
 * Synchronously loads and caches assets with a three loader.
 *
 * Note: this hook's caller must be wrapped with `React.Suspense`
 * @see https://docs.pmnd.rs/react-three-fiber/api/hooks#useloader
 */
function useLoader(loader, input, extensions, onProgress) {
  // Use suspense to load async assets
  const keys = Array.isArray(input) ? input : [input];
  const results = suspendReact.suspend(loadingFn(extensions, onProgress), [loader, ...keys], {
    equal: is.equ
  });
  // Return the object(s)
  return Array.isArray(input) ? results : results[0];
}

/**
 * Preloads an asset into cache as a side-effect.
 */
useLoader.preload = function (loader, input, extensions) {
  const keys = Array.isArray(input) ? input : [input];
  return suspendReact.preload(loadingFn(extensions), [loader, ...keys]);
};

/**
 * Removes a loaded asset from cache.
 */
useLoader.clear = function (loader, input) {
  const keys = Array.isArray(input) ? input : [input];
  return suspendReact.clear([loader, ...keys]);
};

/**
 * @license React
 * react-reconciler-constants.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */const t = 1,
  o = 8,
  r = 32,
  e = 2;

var packageData = {
	name: "@react-three/fiber",
	version: "9.5.0",
	description: "A React renderer for Threejs",
	keywords: [
		"react",
		"renderer",
		"fiber",
		"three",
		"threejs"
	],
	author: "Paul Henschel (https://github.com/drcmda)",
	license: "MIT",
	maintainers: [
		"Josh Ellis (https://github.com/joshuaellis)",
		"Cody Bennett (https://github.com/codyjasonbennett)",
		"Kris Baumgarter (https://github.com/krispya)"
	],
	bugs: {
		url: "https://github.com/pmndrs/react-three-fiber/issues"
	},
	homepage: "https://github.com/pmndrs/react-three-fiber#readme",
	repository: {
		type: "git",
		url: "git+https://github.com/pmndrs/react-three-fiber.git"
	},
	collective: {
		type: "opencollective",
		url: "https://opencollective.com/react-three-fiber"
	},
	main: "dist/react-three-fiber.cjs.js",
	module: "dist/react-three-fiber.esm.js",
	types: "dist/react-three-fiber.cjs.d.ts",
	"react-native": "native/dist/react-three-fiber-native.cjs.js",
	sideEffects: false,
	preconstruct: {
		entrypoints: [
			"index.tsx",
			"native.tsx"
		]
	},
	scripts: {
		prebuild: "cp ../../readme.md readme.md"
	},
	devDependencies: {
		"@types/react-reconciler": "^0.32.3",
		"react-reconciler": "^0.33.0"
	},
	dependencies: {
		"@babel/runtime": "^7.17.8",
		"@types/webxr": "*",
		"base64-js": "^1.5.1",
		buffer: "^6.0.3",
		"its-fine": "^2.0.0",
		"react-use-measure": "^2.1.7",
		scheduler: "^0.27.0",
		"suspend-react": "^0.1.3",
		"use-sync-external-store": "^1.4.0",
		zustand: "^5.0.3"
	},
	peerDependencies: {
		expo: ">=43.0",
		"expo-asset": ">=8.4",
		"expo-file-system": ">=11.0",
		"expo-gl": ">=11.0",
		react: ">=19 <19.3",
		"react-dom": ">=19 <19.3",
		"react-native": ">=0.78",
		three: ">=0.156"
	},
	peerDependenciesMeta: {
		"react-dom": {
			optional: true
		},
		"react-native": {
			optional: true
		},
		expo: {
			optional: true
		},
		"expo-asset": {
			optional: true
		},
		"expo-file-system": {
			optional: true
		},
		"expo-gl": {
			optional: true
		}
	}
};

function Xb(Tt) {
  return Tt && Tt.__esModule && Object.prototype.hasOwnProperty.call(Tt, "default") ? Tt.default : Tt;
}
var Rm = {
    exports: {}
  },
  Og = {
    exports: {}
  }; /**
     * @license React
     * react-reconciler.production.js
     *
     * Copyright (c) Meta Platforms, Inc. and affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
Og.exports;
  var _b;
function Kb() {
  return _b || (_b = 1, function (Tt) {

    Tt.exports = function (m) {
      function Yn(t, r, a, l) {
        return new uc(t, r, a, l);
      }
      function _d() {}
      function F(t) {
        var r = "https://react.dev/errors/" + t;
        if (1 < arguments.length) {
          r += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var a = 2; a < arguments.length; a++) r += "&args[]=" + encodeURIComponent(arguments[a]);
        }
        return "Minified React error #" + t + "; visit " + r + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function Rd(t) {
        var r = t,
          a = t;
        if (t.alternate) for (; r.return;) r = r.return;else {
          t = r;
          do r = t, (r.flags & 4098) !== 0 && (a = r.return), t = r.return; while (t);
        }
        return r.tag === 3 ? a : null;
      }
      function du(t) {
        if (Rd(t) !== t) throw Error(F(188));
      }
      function fu(t) {
        var r = t.alternate;
        if (!r) {
          if (r = Rd(t), r === null) throw Error(F(188));
          return r !== t ? null : t;
        }
        for (var a = t, l = r;;) {
          var c = a.return;
          if (c === null) break;
          var d = c.alternate;
          if (d === null) {
            if (l = c.return, l !== null) {
              a = l;
              continue;
            }
            break;
          }
          if (c.child === d.child) {
            for (d = c.child; d;) {
              if (d === a) return du(c), t;
              if (d === l) return du(c), r;
              d = d.sibling;
            }
            throw Error(F(188));
          }
          if (a.return !== l.return) a = c, l = d;else {
            for (var h = !1, y = c.child; y;) {
              if (y === a) {
                h = !0, a = c, l = d;
                break;
              }
              if (y === l) {
                h = !0, l = c, a = d;
                break;
              }
              y = y.sibling;
            }
            if (!h) {
              for (y = d.child; y;) {
                if (y === a) {
                  h = !0, a = d, l = c;
                  break;
                }
                if (y === l) {
                  h = !0, l = d, a = c;
                  break;
                }
                y = y.sibling;
              }
              if (!h) throw Error(F(189));
            }
          }
          if (a.alternate !== l) throw Error(F(190));
        }
        if (a.tag !== 3) throw Error(F(188));
        return a.stateNode.current === a ? t : r;
      }
      function pu(t) {
        var r = t.tag;
        if (r === 5 || r === 26 || r === 27 || r === 6) return t;
        for (t = t.child; t !== null;) {
          if (r = pu(t), r !== null) return r;
          t = t.sibling;
        }
        return null;
      }
      function lt(t) {
        var r = t.tag;
        if (r === 5 || r === 26 || r === 27 || r === 6) return t;
        for (t = t.child; t !== null;) {
          if (t.tag !== 4 && (r = lt(t), r !== null)) return r;
          t = t.sibling;
        }
        return null;
      }
      function Fl(t) {
        return t === null || typeof t != "object" ? null : (t = Pf && t[Pf] || t["@@iterator"], typeof t == "function" ? t : null);
      }
      function hu(t) {
        if (t == null) return null;
        if (typeof t == "function") return t.$$typeof === xf ? null : t.displayName || t.name || null;
        if (typeof t == "string") return t;
        switch (t) {
          case $a:
            return "Fragment";
          case Cs:
            return "Profiler";
          case kf:
            return "StrictMode";
          case Va:
            return "Suspense";
          case Te:
            return "SuspenseList";
          case gc:
            return "Activity";
        }
        if (typeof t == "object") switch (t.$$typeof) {
          case sa:
            return "Portal";
          case Io:
            return t.displayName || "Context";
          case mc:
            return (t._context.displayName || "Context") + ".Consumer";
          case Zi:
            var r = t.render;
            return t = t.displayName, t || (t = r.displayName || r.name || "", t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef"), t;
          case wf:
            return r = t.displayName || null, r !== null ? r : hu(t.type) || "Memo";
          case ua:
            r = t._payload, t = t._init;
            try {
              return hu(t(r));
            } catch {}
        }
        return null;
      }
      function Ir(t) {
        return {
          current: t
        };
      }
      function D(t) {
        0 > tl || (t.current = Hs[tl], Hs[tl] = null, tl--);
      }
      function Ce(t, r) {
        tl++, Hs[tl] = t.current, t.current = r;
      }
      function Em(t) {
        return t >>>= 0, t === 0 ? 32 : 31 - (Dh(t) / Wh | 0) | 0;
      }
      function Zo(t) {
        var r = t & 42;
        if (r !== 0) return r;
        switch (t & -t) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
            return 64;
          case 128:
            return 128;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
            return t & 261888;
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return t & 3932160;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return t & 62914560;
          case 67108864:
            return 67108864;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 0;
          default:
            return t;
        }
      }
      function Lr(t, r, a) {
        var l = t.pendingLanes;
        if (l === 0) return 0;
        var c = 0,
          d = t.suspendedLanes,
          h = t.pingedLanes;
        t = t.warmLanes;
        var y = l & 134217727;
        return y !== 0 ? (l = y & ~d, l !== 0 ? c = Zo(l) : (h &= y, h !== 0 ? c = Zo(h) : a || (a = y & ~t, a !== 0 && (c = Zo(a))))) : (y = l & ~d, y !== 0 ? c = Zo(y) : h !== 0 ? c = Zo(h) : a || (a = l & ~t, a !== 0 && (c = Zo(a)))), c === 0 ? 0 : r !== 0 && r !== c && (r & d) === 0 && (d = c & -c, a = r & -r, d >= a || d === 32 && (a & 4194048) !== 0) ? r : c;
      }
      function Pi(t, r) {
        return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & r) === 0;
      }
      function Tp(t, r) {
        switch (t) {
          case 1:
          case 2:
          case 4:
          case 8:
          case 64:
            return r + 250;
          case 16:
          case 32:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return r + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return -1;
          case 67108864:
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function Ed() {
        var t = rl;
        return rl <<= 1, (rl & 62914560) === 0 && (rl = 4194304), t;
      }
      function mu(t) {
        for (var r = [], a = 0; 31 > a; a++) r.push(t);
        return r;
      }
      function xi(t, r) {
        t.pendingLanes |= r, r !== 268435456 && (t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0);
      }
      function _p(t, r, a, l, c, d) {
        var h = t.pendingLanes;
        t.pendingLanes = a, t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0, t.expiredLanes &= a, t.entangledLanes &= a, t.errorRecoveryDisabledLanes &= a, t.shellSuspendCounter = 0;
        var y = t.entanglements,
          R = t.expirationTimes,
          L = t.hiddenUpdates;
        for (a = h & ~a; 0 < a;) {
          var j = 31 - vt(a),
            A = 1 << j;
          y[j] = 0, R[j] = -1;
          var W = L[j];
          if (W !== null) for (L[j] = null, j = 0; j < W.length; j++) {
            var V = W[j];
            V !== null && (V.lane &= -536870913);
          }
          a &= ~A;
        }
        l !== 0 && Yo(t, l, 0), d !== 0 && c === 0 && t.tag !== 0 && (t.suspendedLanes |= d & ~(h & ~r));
      }
      function Yo(t, r, a) {
        t.pendingLanes |= r, t.suspendedLanes &= ~r;
        var l = 31 - vt(r);
        t.entangledLanes |= r, t.entanglements[l] = t.entanglements[l] | 1073741824 | a & 261930;
      }
      function $e(t, r) {
        var a = t.entangledLanes |= r;
        for (t = t.entanglements; a;) {
          var l = 31 - vt(a),
            c = 1 << l;
          c & r | t[l] & r && (t[l] |= r), a &= ~c;
        }
      }
      function G(t, r) {
        var a = r & -r;
        return a = (a & 42) !== 0 ? 1 : st(a), (a & (t.suspendedLanes | r)) !== 0 ? 0 : a;
      }
      function st(t) {
        switch (t) {
          case 2:
            t = 1;
            break;
          case 8:
            t = 4;
            break;
          case 32:
            t = 16;
            break;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            t = 128;
            break;
          case 268435456:
            t = 134217728;
            break;
          default:
            t = 0;
        }
        return t;
      }
      function Ze(t) {
        return t &= -t, 2 < t ? 8 < t ? (t & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
      }
      function pe(t) {
        if (typeof Lc == "function" && Uf(t), on && typeof on.setStrictMode == "function") try {
          on.setStrictMode(ei, t);
        } catch {}
      }
      function Im(t, r) {
        return t === r && (t !== 0 || 1 / t === 1 / r) || t !== t && r !== r;
      }
      function _t(t) {
        if (al === void 0) try {
          throw Error();
        } catch (a) {
          var r = a.stack.trim().match(/\n( *(at )?)/);
          al = r && r[1] || "", kt = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : "";
        }
        return `
` + al + t + kt;
      }
      function zi(t, r) {
        if (!t || Ds) return "";
        Ds = !0;
        var a = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          var l = {
            DetermineComponentFrameRoot: function () {
              try {
                if (r) {
                  var A = function () {
                    throw Error();
                  };
                  if (Object.defineProperty(A.prototype, "props", {
                    set: function () {
                      throw Error();
                    }
                  }), typeof Reflect == "object" && Reflect.construct) {
                    try {
                      Reflect.construct(A, []);
                    } catch (V) {
                      var W = V;
                    }
                    Reflect.construct(t, [], A);
                  } else {
                    try {
                      A.call();
                    } catch (V) {
                      W = V;
                    }
                    t.call(A.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (V) {
                    W = V;
                  }
                  (A = t()) && typeof A.catch == "function" && A.catch(function () {});
                }
              } catch (V) {
                if (V && W && typeof V.stack == "string") return [V.stack, W.stack];
              }
              return [null, null];
            }
          };
          l.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
          var c = Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot, "name");
          c && c.configurable && Object.defineProperty(l.DetermineComponentFrameRoot, "name", {
            value: "DetermineComponentFrameRoot"
          });
          var d = l.DetermineComponentFrameRoot(),
            h = d[0],
            y = d[1];
          if (h && y) {
            var R = h.split(`
`),
              L = y.split(`
`);
            for (c = l = 0; l < R.length && !R[l].includes("DetermineComponentFrameRoot");) l++;
            for (; c < L.length && !L[c].includes("DetermineComponentFrameRoot");) c++;
            if (l === R.length || c === L.length) for (l = R.length - 1, c = L.length - 1; 1 <= l && 0 <= c && R[l] !== L[c];) c--;
            for (; 1 <= l && 0 <= c; l--, c--) if (R[l] !== L[c]) {
              if (l !== 1 || c !== 1) do if (l--, c--, 0 > c || R[l] !== L[c]) {
                var j = `
` + R[l].replace(" at new ", " at ");
                return t.displayName && j.includes("<anonymous>") && (j = j.replace("<anonymous>", t.displayName)), j;
              } while (1 <= l && 0 <= c);
              break;
            }
          }
        } finally {
          Ds = !1, Error.prepareStackTrace = a;
        }
        return (a = t ? t.displayName || t.name : "") ? _t(a) : "";
      }
      function Hl(t, r) {
        switch (t.tag) {
          case 26:
          case 27:
          case 5:
            return _t(t.type);
          case 16:
            return _t("Lazy");
          case 13:
            return t.child !== r && r !== null ? _t("Suspense Fallback") : _t("Suspense");
          case 19:
            return _t("SuspenseList");
          case 0:
          case 15:
            return zi(t.type, !1);
          case 11:
            return zi(t.type.render, !1);
          case 1:
            return zi(t.type, !0);
          case 31:
            return _t("Activity");
          default:
            return "";
        }
      }
      function Rp(t) {
        try {
          var r = "",
            a = null;
          do r += Hl(t, a), a = t, t = t.return; while (t);
          return r;
        } catch (l) {
          return `
Error generating stack: ` + l.message + `
` + l.stack;
        }
      }
      function ut(t, r) {
        if (typeof t == "object" && t !== null) {
          var a = Bh.get(t);
          return a !== void 0 ? a : (r = {
            value: t,
            source: r,
            stack: Rp(r)
          }, Bh.set(t, r), r);
        }
        return {
          value: t,
          source: r,
          stack: Rp(r)
        };
      }
      function or(t, r) {
        ni[il++] = x, ni[il++] = fn, fn = t, x = r;
      }
      function Ci(t, r, a) {
        Jt[Zt++] = ot, Jt[Zt++] = Zr, Jt[Zt++] = jo, jo = t;
        var l = ot;
        t = Zr;
        var c = 32 - vt(l) - 1;
        l &= ~(1 << c), a += 1;
        var d = 32 - vt(r) + c;
        if (30 < d) {
          var h = c - c % 5;
          d = (l & (1 << h) - 1).toString(32), l >>= h, c -= h, ot = 1 << 32 - vt(r) + c | a << c | l, Zr = d + t;
        } else ot = 1 << d | a << c | l, Zr = t;
      }
      function Id(t) {
        t.return !== null && (or(t, 1), Ci(t, 1, 0));
      }
      function gu(t) {
        for (; t === fn;) fn = ni[--il], ni[il] = null, x = ni[--il], ni[il] = null;
        for (; t === jo;) jo = Jt[--Zt], Jt[Zt] = null, Zr = Jt[--Zt], Jt[Zt] = null, ot = Jt[--Zt], Jt[Zt] = null;
      }
      function Ld(t, r) {
        Jt[Zt++] = ot, Jt[Zt++] = Zr, Jt[Zt++] = jo, ot = r.id, Zr = r.overflow, jo = t;
      }
      function Al(t, r) {
        Ce(pa, r), Ce(Ws, t), Ce(Dn, null), t = Hm(r), D(Dn), Ce(Dn, t);
      }
      function Xo() {
        D(Dn), D(Ws), D(pa);
      }
      function yu(t) {
        t.memoizedState !== null && Ce(Fc, t);
        var r = Dn.current,
          a = Xp(r, t.type);
        r !== a && (Ce(Ws, t), Ce(Dn, a));
      }
      function jl(t) {
        Ws.current === t && (D(Dn), D(Ws)), Fc.current === t && (D(Fc), qt ? da._currentValue = rt : da._currentValue2 = rt);
      }
      function ar(t) {
        var r = Error(F(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""));
        throw ct(ut(r, t)), Of;
      }
      function Ep(t, r) {
        if (!Hn) throw Error(F(175));
        Ki(t.stateNode, t.type, t.memoizedProps, r, t) || ar(t, !0);
      }
      function De(t) {
        for (bn = t.return; bn;) switch (bn.tag) {
          case 5:
          case 31:
          case 13:
            Yt = !1;
            return;
          case 27:
          case 3:
            Yt = !0;
            return;
          default:
            bn = bn.return;
        }
      }
      function Ti(t) {
        if (!Hn || t !== bn) return !1;
        if (!ue) return De(t), ue = !0, !1;
        var r = t.tag;
        if (dn ? r !== 3 && r !== 27 && (r !== 5 || Nh(t.type) && !Rs(t.type, t.memoizedProps)) && Ue && ar(t) : r !== 3 && (r !== 5 || Nh(t.type) && !Rs(t.type, t.memoizedProps)) && Ue && ar(t), De(t), r === 13) {
          if (!Hn) throw Error(F(316));
          if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(F(317));
          Ue = Th(t);
        } else if (r === 31) {
          if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(F(317));
          Ue = Ch(t);
        } else Ue = dn && r === 27 ? kh(t.type, Ue) : bn ? Nf(t.stateNode) : null;
        return !0;
      }
      function _a() {
        Hn && (Ue = bn = null, ue = !1);
      }
      function Dl() {
        var t = Do;
        return t !== null && (xt === null ? xt = t : xt.push.apply(xt, t), Do = null), t;
      }
      function ct(t) {
        Do === null ? Do = [t] : Do.push(t);
      }
      function fo(t, r, a) {
        qt ? (Ce(Yr, r._currentValue), r._currentValue = a) : (Ce(Yr, r._currentValue2), r._currentValue2 = a);
      }
      function En(t) {
        var r = Yr.current;
        qt ? t._currentValue = r : t._currentValue2 = r, D(Yr);
      }
      function Ot(t, r, a) {
        for (; t !== null;) {
          var l = t.alternate;
          if ((t.childLanes & r) !== r ? (t.childLanes |= r, l !== null && (l.childLanes |= r)) : l !== null && (l.childLanes & r) !== r && (l.childLanes |= r), t === a) break;
          t = t.return;
        }
      }
      function _i(t, r, a, l) {
        var c = t.child;
        for (c !== null && (c.return = t); c !== null;) {
          var d = c.dependencies;
          if (d !== null) {
            var h = c.child;
            d = d.firstContext;
            e: for (; d !== null;) {
              var y = d;
              d = c;
              for (var R = 0; R < r.length; R++) if (y.context === r[R]) {
                d.lanes |= a, y = d.alternate, y !== null && (y.lanes |= a), Ot(d.return, a, t), l || (h = null);
                break e;
              }
              d = y.next;
            }
          } else if (c.tag === 18) {
            if (h = c.return, h === null) throw Error(F(341));
            h.lanes |= a, d = h.alternate, d !== null && (d.lanes |= a), Ot(h, a, t), h = null;
          } else h = c.child;
          if (h !== null) h.return = c;else for (h = c; h !== null;) {
            if (h === t) {
              h = null;
              break;
            }
            if (c = h.sibling, c !== null) {
              c.return = h.return, h = c;
              break;
            }
            h = h.return;
          }
          c = h;
        }
      }
      function po(t, r, a, l) {
        t = null;
        for (var c = r, d = !1; c !== null;) {
          if (!d) {
            if ((c.flags & 524288) !== 0) d = !0;else if ((c.flags & 262144) !== 0) break;
          }
          if (c.tag === 10) {
            var h = c.alternate;
            if (h === null) throw Error(F(387));
            if (h = h.memoizedProps, h !== null) {
              var y = c.type;
              jn(c.pendingProps.value, h.value) || (t !== null ? t.push(y) : t = [y]);
            }
          } else if (c === Fc.current) {
            if (h = c.alternate, h === null) throw Error(F(387));
            h.memoizedState.memoizedState !== c.memoizedState.memoizedState && (t !== null ? t.push(da) : t = [da]);
          }
          c = c.return;
        }
        t !== null && _i(r, t, a, l), r.flags |= 262144;
      }
      function Ri(t) {
        for (t = t.firstContext; t !== null;) {
          var r = t.context;
          if (!jn(qt ? r._currentValue : r._currentValue2, t.memoizedValue)) return !0;
          t = t.next;
        }
        return !1;
      }
      function Un(t) {
        at = t, Be = null, t = t.dependencies, t !== null && (t.firstContext = null);
      }
      function In(t) {
        return Nd(at, t);
      }
      function Wl(t, r) {
        return at === null && Un(t), Nd(t, r);
      }
      function Nd(t, r) {
        var a = qt ? r._currentValue : r._currentValue2;
        if (r = {
          context: r,
          memoizedValue: a,
          next: null
        }, Be === null) {
          if (t === null) throw Error(F(308));
          Be = r, t.dependencies = {
            lanes: 0,
            firstContext: r
          }, t.flags |= 524288;
        } else Be = Be.next = r;
        return a;
      }
      function Fd() {
        return {
          controller: new Xr(),
          data: new Map(),
          refCount: 0
        };
      }
      function Ra(t) {
        t.refCount--, t.refCount === 0 && qn(Gm, function () {
          t.controller.abort();
        });
      }
      function bu() {}
      function ir(t) {
        t !== wt && t.next === null && (wt === null ? an = wt = t : wt = wt.next = t), ll = !0, Mf || (Mf = !0, Lm());
      }
      function Ea(t, r) {
        if (!ti && ll) {
          ti = !0;
          do for (var a = !1, l = an; l !== null;) {
            if (!r) if (t !== 0) {
              var c = l.pendingLanes;
              if (c === 0) var d = 0;else {
                var h = l.suspendedLanes,
                  y = l.pingedLanes;
                d = (1 << 31 - vt(42 | t) + 1) - 1, d &= c & ~(h & ~y), d = d & 201326741 ? d & 201326741 | 1 : d ? d | 2 : 0;
              }
              d !== 0 && (a = !0, Su(l, d));
            } else d = he, d = Lr(l, l === Ne ? d : 0, l.cancelPendingCommit !== null || l.timeoutHandle !== Lo), (d & 3) === 0 || Pi(l, d) || (a = !0, Su(l, d));
            l = l.next;
          } while (a);
          ti = !1;
        }
      }
      function Ip() {
        Lp();
      }
      function Lp() {
        ll = Mf = !1;
        var t = 0;
        Pr !== 0 && _f() && (t = Pr);
        for (var r = ze(), a = null, l = an; l !== null;) {
          var c = l.next,
            d = vu(l, r);
          d === 0 ? (l.next = null, a === null ? an = c : a.next = c, c === null && (wt = a)) : (a = l, (t !== 0 || (d & 3) !== 0) && (ll = !0)), l = c;
        }
        Re !== 0 && Re !== 5 || Ea(t, !1), Pr !== 0 && (Pr = 0);
      }
      function vu(t, r) {
        for (var a = t.suspendedLanes, l = t.pingedLanes, c = t.expirationTimes, d = t.pendingLanes & -62914561; 0 < d;) {
          var h = 31 - vt(d),
            y = 1 << h,
            R = c[h];
          R === -1 ? ((y & a) === 0 || (y & l) !== 0) && (c[h] = Tp(y, r)) : R <= r && (t.expiredLanes |= y), d &= ~y;
        }
        if (r = Ne, a = he, a = Lr(t, t === r ? a : 0, t.cancelPendingCommit !== null || t.timeoutHandle !== Lo), l = t.callbackNode, a === 0 || t === r && (_e === 2 || _e === 9) || t.cancelPendingCommit !== null) return l !== null && l !== null && le(l), t.callbackNode = null, t.callbackPriority = 0;
        if ((a & 3) === 0 || Pi(t, a)) {
          if (r = a & -a, r === t.callbackPriority) return r;
          switch (l !== null && le(l), Ze(a)) {
            case 2:
            case 8:
              a = Ho;
              break;
            case 32:
              a = Ao;
              break;
            case 268435456:
              a = ol;
              break;
            default:
              a = Ao;
          }
          return l = dt.bind(null, t), a = Ic(a, l), t.callbackPriority = r, t.callbackNode = a, r;
        }
        return l !== null && l !== null && le(l), t.callbackPriority = 2, t.callbackNode = null, 2;
      }
      function dt(t, r) {
        if (Re !== 0 && Re !== 5) return t.callbackNode = null, t.callbackPriority = 0, null;
        var a = t.callbackNode;
        if (rn() && t.callbackNode !== a) return null;
        var l = he;
        return l = Lr(t, t === Ne ? l : 0, t.cancelPendingCommit !== null || t.timeoutHandle !== Lo), l === 0 ? null : (uf(t, l, r), vu(t, ze()), t.callbackNode != null && t.callbackNode === a ? dt.bind(null, t) : null);
      }
      function Su(t, r) {
        if (rn()) return null;
        uf(t, r, !0);
      }
      function Lm() {
        ih ? Gr(function () {
          (ce & 6) !== 0 ? Ic(Uh, Ip) : Lp();
        }) : Ic(Uh, Ip);
      }
      function ku() {
        if (Pr === 0) {
          var t = sl;
          t === 0 && (t = As, As <<= 1, (As & 261888) === 0 && (As = 256)), Pr = t;
        }
        return Pr;
      }
      function Np(t, r) {
        if (Us === null) {
          var a = Us = [];
          Qf = 0, sl = ku(), ul = {
            status: "pending",
            value: void 0,
            then: function (l) {
              a.push(l);
            }
          };
        }
        return Qf++, r.then(ft, ft), r;
      }
      function ft() {
        if (--Qf === 0 && Us !== null) {
          ul !== null && (ul.status = "fulfilled");
          var t = Us;
          Us = null, sl = 0, ul = null;
          for (var r = 0; r < t.length; r++) (0, t[r])();
        }
      }
      function ho(t, r) {
        var a = [],
          l = {
            status: "pending",
            value: null,
            reason: null,
            then: function (c) {
              a.push(c);
            }
          };
        return t.then(function () {
          l.status = "fulfilled", l.value = r;
          for (var c = 0; c < a.length; c++) (0, a[c])(r);
        }, function (c) {
          for (l.status = "rejected", l.reason = c, c = 0; c < a.length; c++) (0, a[c])(void 0);
        }), l;
      }
      function wu() {
        var t = ha.current;
        return t !== null ? t : Ne.pooledCache;
      }
      function Ei(t, r) {
        r === null ? Ce(ha, ha.current) : Ce(ha, r.pool);
      }
      function Pu() {
        var t = wu();
        return t === null ? null : {
          parent: qt ? qe._currentValue : qe._currentValue2,
          pool: t
        };
      }
      function Ul(t, r) {
        if (jn(t, r)) return !0;
        if (typeof t != "object" || t === null || typeof r != "object" || r === null) return !1;
        var a = Object.keys(t),
          l = Object.keys(r);
        if (a.length !== l.length) return !1;
        for (l = 0; l < a.length; l++) {
          var c = a[l];
          if (!Bf.call(r, c) || !jn(t[c], r[c])) return !1;
        }
        return !0;
      }
      function Hd(t) {
        return t = t.status, t === "fulfilled" || t === "rejected";
      }
      function mo(t, r, a) {
        switch (a = t[a], a === void 0 ? t.push(r) : a !== r && (r.then(bu, bu), r = a), r.status) {
          case "fulfilled":
            return r.value;
          case "rejected":
            throw t = r.reason, Ia(t), t;
          default:
            if (typeof r.status == "string") r.then(bu, bu);else {
              if (t = Ne, t !== null && 100 < t.shellSuspendCounter) throw Error(F(482));
              t = r, t.status = "pending", t.then(function (l) {
                if (r.status === "pending") {
                  var c = r;
                  c.status = "fulfilled", c.value = l;
                }
              }, function (l) {
                if (r.status === "pending") {
                  var c = r;
                  c.status = "rejected", c.reason = l;
                }
              });
            }
            switch (r.status) {
              case "fulfilled":
                return r.value;
              case "rejected":
                throw t = r.reason, Ia(t), t;
            }
            throw Xt = r, cl;
        }
      }
      function pt(t) {
        try {
          var r = t._init;
          return r(t._payload);
        } catch (a) {
          throw a !== null && typeof a == "object" && typeof a.then == "function" ? (Xt = a, cl) : a;
        }
      }
      function Bl() {
        if (Xt === null) throw Error(F(459));
        var t = Xt;
        return Xt = null, t;
      }
      function Ia(t) {
        if (t === cl || t === jc) throw Error(F(483));
      }
      function Rt(t) {
        var r = Bs;
        return Bs += 1, Kt === null && (Kt = []), mo(Kt, t, r);
      }
      function La(t, r) {
        r = r.props.ref, t.ref = r !== void 0 ? r : null;
      }
      function Na(t, r) {
        throw r.$$typeof === hc ? Error(F(525)) : (t = Object.prototype.toString.call(r), Error(F(31, t === "[object Object]" ? "object with keys {" + Object.keys(r).join(", ") + "}" : t)));
      }
      function Ad(t) {
        function r(P, w) {
          if (t) {
            var C = P.deletions;
            C === null ? (P.deletions = [w], P.flags |= 16) : C.push(w);
          }
        }
        function a(P, w) {
          if (!t) return null;
          for (; w !== null;) r(P, w), w = w.sibling;
          return null;
        }
        function l(P) {
          for (var w = new Map(); P !== null;) P.key !== null ? w.set(P.key, P) : w.set(P.index, P), P = P.sibling;
          return w;
        }
        function c(P, w) {
          return P = Qr(P, w), P.index = 0, P.sibling = null, P;
        }
        function d(P, w, C) {
          return P.index = C, t ? (C = P.alternate, C !== null ? (C = C.index, C < w ? (P.flags |= 67108866, w) : C) : (P.flags |= 67108866, w)) : (P.flags |= 1048576, w);
        }
        function h(P) {
          return t && P.alternate === null && (P.flags |= 67108866), P;
        }
        function y(P, w, C, H) {
          return w === null || w.tag !== 6 ? (w = Ps(C, P.mode, H), w.return = P, w) : (w = c(w, C), w.return = P, w);
        }
        function R(P, w, C, H) {
          var Q = C.type;
          return Q === $a ? j(P, w, C.props.children, H, C.key) : w !== null && (w.elementType === Q || typeof Q == "object" && Q !== null && Q.$$typeof === ua && pt(Q) === w.type) ? (w = c(w, C.props), La(w, C), w.return = P, w) : (w = ws(C.type, C.key, C.props, null, P.mode, H), La(w, C), w.return = P, w);
        }
        function L(P, w, C, H) {
          return w === null || w.tag !== 4 || w.stateNode.containerInfo !== C.containerInfo || w.stateNode.implementation !== C.implementation ? (w = dc(C, P.mode, H), w.return = P, w) : (w = c(w, C.children || []), w.return = P, w);
        }
        function j(P, w, C, H, Q) {
          return w === null || w.tag !== 7 ? (w = Eo(C, P.mode, H, Q), w.return = P, w) : (w = c(w, C), w.return = P, w);
        }
        function A(P, w, C) {
          if (typeof w == "string" && w !== "" || typeof w == "number" || typeof w == "bigint") return w = Ps("" + w, P.mode, C), w.return = P, w;
          if (typeof w == "object" && w !== null) {
            switch (w.$$typeof) {
              case zs:
                return C = ws(w.type, w.key, w.props, null, P.mode, C), La(C, w), C.return = P, C;
              case sa:
                return w = dc(w, P.mode, C), w.return = P, w;
              case ua:
                return w = pt(w), A(P, w, C);
            }
            if (ca(w) || Fl(w)) return w = Eo(w, P.mode, C, null), w.return = P, w;
            if (typeof w.then == "function") return A(P, Rt(w), C);
            if (w.$$typeof === Io) return A(P, Wl(P, w), C);
            Na(P, w);
          }
          return null;
        }
        function W(P, w, C, H) {
          var Q = w !== null ? w.key : null;
          if (typeof C == "string" && C !== "" || typeof C == "number" || typeof C == "bigint") return Q !== null ? null : y(P, w, "" + C, H);
          if (typeof C == "object" && C !== null) {
            switch (C.$$typeof) {
              case zs:
                return C.key === Q ? R(P, w, C, H) : null;
              case sa:
                return C.key === Q ? L(P, w, C, H) : null;
              case ua:
                return C = pt(C), W(P, w, C, H);
            }
            if (ca(C) || Fl(C)) return Q !== null ? null : j(P, w, C, H, null);
            if (typeof C.then == "function") return W(P, w, Rt(C), H);
            if (C.$$typeof === Io) return W(P, w, Wl(P, C), H);
            Na(P, C);
          }
          return null;
        }
        function V(P, w, C, H, Q) {
          if (typeof H == "string" && H !== "" || typeof H == "number" || typeof H == "bigint") return P = P.get(C) || null, y(w, P, "" + H, Q);
          if (typeof H == "object" && H !== null) {
            switch (H.$$typeof) {
              case zs:
                return P = P.get(H.key === null ? C : H.key) || null, R(w, P, H, Q);
              case sa:
                return P = P.get(H.key === null ? C : H.key) || null, L(w, P, H, Q);
              case ua:
                return H = pt(H), V(P, w, C, H, Q);
            }
            if (ca(H) || Fl(H)) return P = P.get(C) || null, j(w, P, H, Q, null);
            if (typeof H.then == "function") return V(P, w, C, Rt(H), Q);
            if (H.$$typeof === Io) return V(P, w, C, Wl(w, H), Q);
            Na(w, H);
          }
          return null;
        }
        function Oe(P, w, C, H) {
          for (var Q = null, Ge = null, J = w, Pe = w = 0, me = null; J !== null && Pe < C.length; Pe++) {
            J.index > Pe ? (me = J, J = null) : me = J.sibling;
            var be = W(P, J, C[Pe], H);
            if (be === null) {
              J === null && (J = me);
              break;
            }
            t && J && be.alternate === null && r(P, J), w = d(be, w, Pe), Ge === null ? Q = be : Ge.sibling = be, Ge = be, J = me;
          }
          if (Pe === C.length) return a(P, J), ue && or(P, Pe), Q;
          if (J === null) {
            for (; Pe < C.length; Pe++) J = A(P, C[Pe], H), J !== null && (w = d(J, w, Pe), Ge === null ? Q = J : Ge.sibling = J, Ge = J);
            return ue && or(P, Pe), Q;
          }
          for (J = l(J); Pe < C.length; Pe++) me = V(J, P, Pe, C[Pe], H), me !== null && (t && me.alternate !== null && J.delete(me.key === null ? Pe : me.key), w = d(me, w, Pe), Ge === null ? Q = me : Ge.sibling = me, Ge = me);
          return t && J.forEach(function (Oo) {
            return r(P, Oo);
          }), ue && or(P, Pe), Q;
        }
        function vn(P, w, C, H) {
          if (C == null) throw Error(F(151));
          for (var Q = null, Ge = null, J = w, Pe = w = 0, me = null, be = C.next(); J !== null && !be.done; Pe++, be = C.next()) {
            J.index > Pe ? (me = J, J = null) : me = J.sibling;
            var Oo = W(P, J, be.value, H);
            if (Oo === null) {
              J === null && (J = me);
              break;
            }
            t && J && Oo.alternate === null && r(P, J), w = d(Oo, w, Pe), Ge === null ? Q = Oo : Ge.sibling = Oo, Ge = Oo, J = me;
          }
          if (be.done) return a(P, J), ue && or(P, Pe), Q;
          if (J === null) {
            for (; !be.done; Pe++, be = C.next()) be = A(P, be.value, H), be !== null && (w = d(be, w, Pe), Ge === null ? Q = be : Ge.sibling = be, Ge = be);
            return ue && or(P, Pe), Q;
          }
          for (J = l(J); !be.done; Pe++, be = C.next()) be = V(J, P, Pe, be.value, H), be !== null && (t && be.alternate !== null && J.delete(be.key === null ? Pe : be.key), w = d(be, w, Pe), Ge === null ? Q = be : Ge.sibling = be, Ge = be);
          return t && J.forEach(function (qs) {
            return r(P, qs);
          }), ue && or(P, Pe), Q;
        }
        function li(P, w, C, H) {
          if (typeof C == "object" && C !== null && C.type === $a && C.key === null && (C = C.props.children), typeof C == "object" && C !== null) {
            switch (C.$$typeof) {
              case zs:
                e: {
                  for (var Q = C.key; w !== null;) {
                    if (w.key === Q) {
                      if (Q = C.type, Q === $a) {
                        if (w.tag === 7) {
                          a(P, w.sibling), H = c(w, C.props.children), H.return = P, P = H;
                          break e;
                        }
                      } else if (w.elementType === Q || typeof Q == "object" && Q !== null && Q.$$typeof === ua && pt(Q) === w.type) {
                        a(P, w.sibling), H = c(w, C.props), La(H, C), H.return = P, P = H;
                        break e;
                      }
                      a(P, w);
                      break;
                    } else r(P, w);
                    w = w.sibling;
                  }
                  C.type === $a ? (H = Eo(C.props.children, P.mode, H, C.key), H.return = P, P = H) : (H = ws(C.type, C.key, C.props, null, P.mode, H), La(H, C), H.return = P, P = H);
                }
                return h(P);
              case sa:
                e: {
                  for (Q = C.key; w !== null;) {
                    if (w.key === Q) {
                      if (w.tag === 4 && w.stateNode.containerInfo === C.containerInfo && w.stateNode.implementation === C.implementation) {
                        a(P, w.sibling), H = c(w, C.children || []), H.return = P, P = H;
                        break e;
                      } else {
                        a(P, w);
                        break;
                      }
                    } else r(P, w);
                    w = w.sibling;
                  }
                  H = dc(C, P.mode, H), H.return = P, P = H;
                }
                return h(P);
              case ua:
                return C = pt(C), li(P, w, C, H);
            }
            if (ca(C)) return Oe(P, w, C, H);
            if (Fl(C)) {
              if (Q = Fl(C), typeof Q != "function") throw Error(F(150));
              return C = Q.call(C), vn(P, w, C, H);
            }
            if (typeof C.then == "function") return li(P, w, Rt(C), H);
            if (C.$$typeof === Io) return li(P, w, Wl(P, C), H);
            Na(P, C);
          }
          return typeof C == "string" && C !== "" || typeof C == "number" || typeof C == "bigint" ? (C = "" + C, w !== null && w.tag === 6 ? (a(P, w.sibling), H = c(w, C), H.return = P, P = H) : (a(P, w), H = Ps(C, P.mode, H), H.return = P, P = H), h(P)) : a(P, w);
        }
        return function (P, w, C, H) {
          try {
            Bs = 0;
            var Q = li(P, w, C, H);
            return Kt = null, Q;
          } catch (J) {
            if (J === cl || J === jc) throw J;
            var Ge = Yn(29, J, null, P.mode);
            return Ge.lanes = H, Ge.return = P, Ge;
          } finally {}
        };
      }
      function Bn() {
        for (var t = xr, r = $f = xr = 0; r < t;) {
          var a = er[r];
          er[r++] = null;
          var l = er[r];
          er[r++] = null;
          var c = er[r];
          er[r++] = null;
          var d = er[r];
          if (er[r++] = null, l !== null && c !== null) {
            var h = l.pending;
            h === null ? c.next = c : (c.next = h.next, h.next = c), l.pending = c;
          }
          d !== 0 && Ii(a, c, d);
        }
      }
      function go(t, r, a, l) {
        er[xr++] = t, er[xr++] = r, er[xr++] = a, er[xr++] = l, $f |= l, t.lanes |= l, t = t.alternate, t !== null && (t.lanes |= l);
      }
      function yo(t, r, a, l) {
        return go(t, r, a, l), Fa(t);
      }
      function Ko(t, r) {
        return go(t, null, null, r), Fa(t);
      }
      function Ii(t, r, a) {
        t.lanes |= a;
        var l = t.alternate;
        l !== null && (l.lanes |= a);
        for (var c = !1, d = t.return; d !== null;) d.childLanes |= a, l = d.alternate, l !== null && (l.childLanes |= a), d.tag === 22 && (t = d.stateNode, t === null || t._visibility & 1 || (c = !0)), t = d, d = d.return;
        return t.tag === 3 ? (d = t.stateNode, c && r !== null && (c = 31 - vt(a), t = d.hiddenUpdates, l = t[c], l === null ? t[c] = [r] : l.push(r), r.lane = a | 536870912), d) : null;
      }
      function Fa(t) {
        if (50 < gl) throw gl = 0, nd = null, Error(F(185));
        for (var r = t.return; r !== null;) t = r, r = t.return;
        return t.tag === 3 ? t.stateNode : null;
      }
      function Ol(t) {
        t.updateQueue = {
          baseState: t.memoizedState,
          firstBaseUpdate: null,
          lastBaseUpdate: null,
          shared: {
            pending: null,
            lanes: 0,
            hiddenCallbacks: null
          },
          callbacks: null
        };
      }
      function Ha(t, r) {
        t = t.updateQueue, r.updateQueue === t && (r.updateQueue = {
          baseState: t.baseState,
          firstBaseUpdate: t.firstBaseUpdate,
          lastBaseUpdate: t.lastBaseUpdate,
          shared: t.shared,
          callbacks: null
        });
      }
      function Et(t) {
        return {
          lane: t,
          tag: 0,
          payload: null,
          callback: null,
          next: null
        };
      }
      function Nr(t, r, a) {
        var l = t.updateQueue;
        if (l === null) return null;
        if (l = l.shared, (ce & 2) !== 0) {
          var c = l.pending;
          return c === null ? r.next = r : (r.next = c.next, c.next = r), l.pending = r, r = Fa(t), Ii(t, null, a), r;
        }
        return go(t, l, r, a), Fa(t);
      }
      function Ml(t, r, a) {
        if (r = r.updateQueue, r !== null && (r = r.shared, (a & 4194048) !== 0)) {
          var l = r.lanes;
          l &= t.pendingLanes, a |= l, r.lanes = a, $e(t, a);
        }
      }
      function jd(t, r) {
        var a = t.updateQueue,
          l = t.alternate;
        if (l !== null && (l = l.updateQueue, a === l)) {
          var c = null,
            d = null;
          if (a = a.firstBaseUpdate, a !== null) {
            do {
              var h = {
                lane: a.lane,
                tag: a.tag,
                payload: a.payload,
                callback: null,
                next: null
              };
              d === null ? c = d = h : d = d.next = h, a = a.next;
            } while (a !== null);
            d === null ? c = d = r : d = d.next = r;
          } else c = d = r;
          a = {
            baseState: l.baseState,
            firstBaseUpdate: c,
            lastBaseUpdate: d,
            shared: l.shared,
            callbacks: l.callbacks
          }, t.updateQueue = a;
          return;
        }
        t = a.lastBaseUpdate, t === null ? a.firstBaseUpdate = r : t.next = r, a.lastBaseUpdate = r;
      }
      function Li() {
        if (Vf) {
          var t = ul;
          if (t !== null) throw t;
        }
      }
      function Aa(t, r, a, l) {
        Vf = !1;
        var c = t.updateQueue;
        ma = !1;
        var d = c.firstBaseUpdate,
          h = c.lastBaseUpdate,
          y = c.shared.pending;
        if (y !== null) {
          c.shared.pending = null;
          var R = y,
            L = R.next;
          R.next = null, h === null ? d = L : h.next = L, h = R;
          var j = t.alternate;
          j !== null && (j = j.updateQueue, y = j.lastBaseUpdate, y !== h && (y === null ? j.firstBaseUpdate = L : y.next = L, j.lastBaseUpdate = R));
        }
        if (d !== null) {
          var A = c.baseState;
          h = 0, j = L = R = null, y = d;
          do {
            var W = y.lane & -536870913,
              V = W !== y.lane;
            if (V ? (he & W) === W : (l & W) === W) {
              W !== 0 && W === sl && (Vf = !0), j !== null && (j = j.next = {
                lane: 0,
                tag: y.tag,
                payload: y.payload,
                callback: null,
                next: null
              });
              e: {
                var Oe = t,
                  vn = y;
                W = r;
                var li = a;
                switch (vn.tag) {
                  case 1:
                    if (Oe = vn.payload, typeof Oe == "function") {
                      A = Oe.call(li, A, W);
                      break e;
                    }
                    A = Oe;
                    break e;
                  case 3:
                    Oe.flags = Oe.flags & -65537 | 128;
                  case 0:
                    if (Oe = vn.payload, W = typeof Oe == "function" ? Oe.call(li, A, W) : Oe, W == null) break e;
                    A = Lt({}, A, W);
                    break e;
                  case 2:
                    ma = !0;
                }
              }
              W = y.callback, W !== null && (t.flags |= 64, V && (t.flags |= 8192), V = c.callbacks, V === null ? c.callbacks = [W] : V.push(W));
            } else V = {
              lane: W,
              tag: y.tag,
              payload: y.payload,
              callback: y.callback,
              next: null
            }, j === null ? (L = j = V, R = A) : j = j.next = V, h |= W;
            if (y = y.next, y === null) {
              if (y = c.shared.pending, y === null) break;
              V = y, y = V.next, V.next = null, c.lastBaseUpdate = V, c.shared.pending = null;
            }
          } while (!0);
          j === null && (R = A), c.baseState = R, c.firstBaseUpdate = L, c.lastBaseUpdate = j, d === null && (c.shared.lanes = 0), ba |= h, t.lanes = h, t.memoizedState = A;
        }
      }
      function Dd(t, r) {
        if (typeof t != "function") throw Error(F(191, t));
        t.call(r);
      }
      function Fp(t, r) {
        var a = t.callbacks;
        if (a !== null) for (t.callbacks = null, t = 0; t < a.length; t++) Dd(a[t], r);
      }
      function B(t, r) {
        t = Uo, Ce(Wc, t), Ce(Kr, r), Uo = t | r.baseLanes;
      }
      function Ql() {
        Ce(Wc, Uo), Ce(Kr, Kr.current);
      }
      function bo() {
        Uo = Wc.current, D(Kr), D(Wc);
      }
      function vo(t) {
        var r = t.alternate;
        Ce(ln, ln.current & 1), Ce(Ft, t), zr === null && (r === null || Kr.current !== null || r.memoizedState !== null) && (zr = t);
      }
      function Ni(t) {
        Ce(ln, ln.current), Ce(Ft, t), zr === null && (zr = t);
      }
      function Fr(t) {
        t.tag === 22 ? (Ce(ln, ln.current), Ce(Ft, t), zr === null && (zr = t)) : So();
      }
      function So() {
        Ce(ln, ln.current), Ce(Ft, Ft.current);
      }
      function ht(t) {
        D(Ft), zr === t && (zr = null), D(ln);
      }
      function ko(t) {
        for (var r = t; r !== null;) {
          if (r.tag === 13) {
            var a = r.memoizedState;
            if (a !== null && (a = a.dehydrated, a === null || Ns(a) || Fs(a))) return r;
          } else if (r.tag === 19 && (r.memoizedProps.revealOrder === "forwards" || r.memoizedProps.revealOrder === "backwards" || r.memoizedProps.revealOrder === "unstable_legacy-backwards" || r.memoizedProps.revealOrder === "together")) {
            if ((r.flags & 128) !== 0) return r;
          } else if (r.child !== null) {
            r.child.return = r, r = r.child;
            continue;
          }
          if (r === t) break;
          for (; r.sibling === null;) {
            if (r.return === null || r.return === t) return null;
            r = r.return;
          }
          r.sibling.return = r.return, r = r.sibling;
        }
        return null;
      }
      function Ve() {
        throw Error(F(321));
      }
      function wo(t, r) {
        if (r === null) return !1;
        for (var a = 0; a < r.length && a < t.length; a++) if (!jn(t[a], r[a])) return !1;
        return !0;
      }
      function $l(t, r, a, l, c, d) {
        return Wo = d, ne = r, r.memoizedState = null, r.updateQueue = null, r.lanes = 0, M.H = t === null || t.memoizedState === null ? Mh : qf, oi = !1, d = a(l, c), oi = !1, dl && (d = xu(r, a, l, c)), Fi(t), d;
      }
      function Fi(t) {
        M.H = Os;
        var r = Ie !== null && Ie.next !== null;
        if (Wo = 0, pn = Ie = ne = null, Uc = !1, fl = 0, pl = null, r) throw Error(F(300));
        t === null || hn || (t = t.dependencies, t !== null && Ri(t) && (hn = !0));
      }
      function xu(t, r, a, l) {
        ne = t;
        var c = 0;
        do {
          if (dl && (pl = null), fl = 0, dl = !1, 25 <= c) throw Error(F(301));
          if (c += 1, pn = Ie = null, t.updateQueue != null) {
            var d = t.updateQueue;
            d.lastEffect = null, d.events = null, d.stores = null, d.memoCache != null && (d.memoCache.index = 0);
          }
          M.H = Qh, d = r(a, l);
        } while (dl);
        return d;
      }
      function zu() {
        var t = M.H,
          r = t.useState()[0];
        return r = typeof r.then == "function" ? sr(r) : r, t = t.useState()[0], (Ie !== null ? Ie.memoizedState : null) !== t && (ne.flags |= 1024), r;
      }
      function Hr() {
        var t = Bc !== 0;
        return Bc = 0, t;
      }
      function lr(t, r, a) {
        r.updateQueue = t.updateQueue, r.flags &= -2053, t.lanes &= ~a;
      }
      function Vl(t) {
        if (Uc) {
          for (t = t.memoizedState; t !== null;) {
            var r = t.queue;
            r !== null && (r.pending = null), t = t.next;
          }
          Uc = !1;
        }
        Wo = 0, pn = Ie = ne = null, dl = !1, fl = Bc = 0, pl = null;
      }
      function Ln() {
        var t = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        };
        return pn === null ? ne.memoizedState = pn = t : pn = pn.next = t, pn;
      }
      function He() {
        if (Ie === null) {
          var t = ne.alternate;
          t = t !== null ? t.memoizedState : null;
        } else t = Ie.next;
        var r = pn === null ? ne.memoizedState : pn.next;
        if (r !== null) pn = r, Ie = t;else {
          if (t === null) throw ne.alternate === null ? Error(F(467)) : Error(F(310));
          Ie = t, t = {
            memoizedState: Ie.memoizedState,
            baseState: Ie.baseState,
            baseQueue: Ie.baseQueue,
            queue: Ie.queue,
            next: null
          }, pn === null ? ne.memoizedState = pn = t : pn = pn.next = t;
        }
        return pn;
      }
      function ja() {
        return {
          lastEffect: null,
          events: null,
          stores: null,
          memoCache: null
        };
      }
      function sr(t) {
        var r = fl;
        return fl += 1, pl === null && (pl = []), t = mo(pl, t, r), r = ne, (pn === null ? r.memoizedState : pn.next) === null && (r = r.alternate, M.H = r === null || r.memoizedState === null ? Mh : qf), t;
      }
      function Ee(t) {
        if (t !== null && typeof t == "object") {
          if (typeof t.then == "function") return sr(t);
          if (t.$$typeof === Io) return In(t);
        }
        throw Error(F(438, String(t)));
      }
      function Hi(t) {
        var r = null,
          a = ne.updateQueue;
        if (a !== null && (r = a.memoCache), r == null) {
          var l = ne.alternate;
          l !== null && (l = l.updateQueue, l !== null && (l = l.memoCache, l != null && (r = {
            data: l.data.map(function (c) {
              return c.slice();
            }),
            index: 0
          })));
        }
        if (r == null && (r = {
          data: [],
          index: 0
        }), a === null && (a = ja(), ne.updateQueue = a), a.memoCache = r, a = r.data[r.index], a === void 0) for (a = r.data[r.index] = Array(t), l = 0; l < t; l++) a[l] = $r;
        return r.index++, a;
      }
      function Ar(t, r) {
        return typeof r == "function" ? r(t) : r;
      }
      function Ai(t) {
        var r = He();
        return Po(r, Ie, t);
      }
      function Po(t, r, a) {
        var l = t.queue;
        if (l === null) throw Error(F(311));
        l.lastRenderedReducer = a;
        var c = t.baseQueue,
          d = l.pending;
        if (d !== null) {
          if (c !== null) {
            var h = c.next;
            c.next = d.next, d.next = h;
          }
          r.baseQueue = c = d, l.pending = null;
        }
        if (d = t.baseState, c === null) t.memoizedState = d;else {
          r = c.next;
          var y = h = null,
            R = null,
            L = r,
            j = !1;
          do {
            var A = L.lane & -536870913;
            if (A !== L.lane ? (he & A) === A : (Wo & A) === A) {
              var W = L.revertLane;
              if (W === 0) R !== null && (R = R.next = {
                lane: 0,
                revertLane: 0,
                gesture: null,
                action: L.action,
                hasEagerState: L.hasEagerState,
                eagerState: L.eagerState,
                next: null
              }), A === sl && (j = !0);else if ((Wo & W) === W) {
                L = L.next, W === sl && (j = !0);
                continue;
              } else A = {
                lane: 0,
                revertLane: L.revertLane,
                gesture: null,
                action: L.action,
                hasEagerState: L.hasEagerState,
                eagerState: L.eagerState,
                next: null
              }, R === null ? (y = R = A, h = d) : R = R.next = A, ne.lanes |= W, ba |= W;
              A = L.action, oi && a(d, A), d = L.hasEagerState ? L.eagerState : a(d, A);
            } else W = {
              lane: A,
              revertLane: L.revertLane,
              gesture: L.gesture,
              action: L.action,
              hasEagerState: L.hasEagerState,
              eagerState: L.eagerState,
              next: null
            }, R === null ? (y = R = W, h = d) : R = R.next = W, ne.lanes |= A, ba |= A;
            L = L.next;
          } while (L !== null && L !== r);
          if (R === null ? h = d : R.next = y, !jn(d, t.memoizedState) && (hn = !0, j && (a = ul, a !== null))) throw a;
          t.memoizedState = d, t.baseState = h, t.baseQueue = R, l.lastRenderedState = d;
        }
        return c === null && (l.lanes = 0), [t.memoizedState, l.dispatch];
      }
      function Da(t) {
        var r = He(),
          a = r.queue;
        if (a === null) throw Error(F(311));
        a.lastRenderedReducer = t;
        var l = a.dispatch,
          c = a.pending,
          d = r.memoizedState;
        if (c !== null) {
          a.pending = null;
          var h = c = c.next;
          do d = t(d, h.action), h = h.next; while (h !== c);
          jn(d, r.memoizedState) || (hn = !0), r.memoizedState = d, r.baseQueue === null && (r.baseState = d), a.lastRenderedState = d;
        }
        return [d, l];
      }
      function ur(t, r, a) {
        var l = ne,
          c = He(),
          d = ue;
        if (d) {
          if (a === void 0) throw Error(F(407));
          a = a();
        } else a = r();
        var h = !jn((Ie || c).memoizedState, a);
        if (h && (c.memoizedState = a, hn = !0), c = c.queue, Tu(ql.bind(null, l, c, t), [t]), c.getSnapshot !== r || h || pn !== null && pn.memoizedState.tag & 1) {
          if (l.flags |= 2048, Kn(9, {
            destroy: void 0
          }, jr.bind(null, l, c, a, r), null), Ne === null) throw Error(F(349));
          d || (Wo & 127) !== 0 || Hp(l, r, a);
        }
        return a;
      }
      function Hp(t, r, a) {
        t.flags |= 16384, t = {
          getSnapshot: r,
          value: a
        }, r = ne.updateQueue, r === null ? (r = ja(), ne.updateQueue = r, r.stores = [t]) : (a = r.stores, a === null ? r.stores = [t] : a.push(t));
      }
      function jr(t, r, a, l) {
        r.value = a, r.getSnapshot = l, ji(r) && Gl(t);
      }
      function ql(t, r, a) {
        return a(function () {
          ji(r) && Gl(t);
        });
      }
      function ji(t) {
        var r = t.getSnapshot;
        t = t.value;
        try {
          var a = r();
          return !jn(t, a);
        } catch {
          return !0;
        }
      }
      function Gl(t) {
        var r = Ko(t, 2);
        r !== null && nt(r, t, 2);
      }
      function Xn(t) {
        var r = Ln();
        if (typeof t == "function") {
          var a = t;
          if (t = a(), oi) {
            pe(!0);
            try {
              a();
            } finally {
              pe(!1);
            }
          }
        }
        return r.memoizedState = r.baseState = t, r.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Ar,
          lastRenderedState: t
        }, r;
      }
      function mt(t, r, a, l) {
        return t.baseState = a, Po(t, Ie, typeof l == "function" ? l : Ar);
      }
      function Dr(t, r, a, l, c) {
        if (na(t)) throw Error(F(485));
        if (t = r.action, t !== null) {
          var d = {
            payload: c,
            action: t,
            next: null,
            isTransition: !0,
            status: "pending",
            value: null,
            reason: null,
            listeners: [],
            then: function (h) {
              d.listeners.push(h);
            }
          };
          M.T !== null ? a(!0) : d.isTransition = !1, l(d), a = r.pending, a === null ? (d.next = r.pending = d, cr(r, d)) : (d.next = a.next, r.pending = a.next = d);
        }
      }
      function cr(t, r) {
        var a = r.action,
          l = r.payload,
          c = t.state;
        if (r.isTransition) {
          var d = M.T,
            h = {};
          M.T = h;
          try {
            var y = a(c, l),
              R = M.S;
            R !== null && R(h, y), dr(t, r, y);
          } catch (L) {
            Jl(t, r, L);
          } finally {
            d !== null && h.types !== null && (d.types = h.types), M.T = d;
          }
        } else try {
          d = a(c, l), dr(t, r, d);
        } catch (L) {
          Jl(t, r, L);
        }
      }
      function dr(t, r, a) {
        a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function (l) {
          fr(t, r, l);
        }, function (l) {
          return Jl(t, r, l);
        }) : fr(t, r, a);
      }
      function fr(t, r, a) {
        r.status = "fulfilled", r.value = a, Cu(r), t.state = a, r = t.pending, r !== null && (a = r.next, a === r ? t.pending = null : (a = a.next, r.next = a, cr(t, a)));
      }
      function Jl(t, r, a) {
        var l = t.pending;
        if (t.pending = null, l !== null) {
          l = l.next;
          do r.status = "rejected", r.reason = a, Cu(r), r = r.next; while (r !== l);
        }
        t.action = null;
      }
      function Cu(t) {
        t = t.listeners;
        for (var r = 0; r < t.length; r++) (0, t[r])();
      }
      function Wd(t, r) {
        return r;
      }
      function pr(t, r) {
        if (ue) {
          var a = Ne.formState;
          if (a !== null) {
            e: {
              var l = ne;
              if (ue) {
                if (Ue) {
                  var c = vh(Ue, Yt);
                  if (c) {
                    Ue = Nf(c), l = Sh(c);
                    break e;
                  }
                }
                ar(l);
              }
              l = !1;
            }
            l && (r = a[0]);
          }
        }
        a = Ln(), a.memoizedState = a.baseState = r, l = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Wd,
          lastRenderedState: r
        }, a.queue = l, a = Nu.bind(null, ne, l), l.dispatch = a, l = Xn(!1);
        var d = Wi.bind(null, ne, !1, l.queue);
        return l = Ln(), c = {
          state: r,
          dispatch: null,
          action: t,
          pending: null
        }, l.queue = c, a = Dr.bind(null, ne, c, d, a), c.dispatch = a, l.memoizedState = t, [r, a, !1];
      }
      function Ud(t) {
        var r = He();
        return hr(r, Ie, t);
      }
      function hr(t, r, a) {
        if (r = Po(t, r, Wd)[0], t = Ai(Ar)[0], typeof r == "object" && r !== null && typeof r.then == "function") try {
          var l = sr(r);
        } catch (h) {
          throw h === cl ? jc : h;
        } else l = r;
        r = He();
        var c = r.queue,
          d = c.dispatch;
        return a !== r.memoizedState && (ne.flags |= 2048, Kn(9, {
          destroy: void 0
        }, Zl.bind(null, c, a), null)), [l, d, t];
      }
      function Zl(t, r) {
        t.action = r;
      }
      function Yl(t) {
        var r = He(),
          a = Ie;
        if (a !== null) return hr(r, a, t);
        He(), r = r.memoizedState, a = He();
        var l = a.queue.dispatch;
        return a.memoizedState = t, [r, l, !1];
      }
      function Kn(t, r, a, l) {
        return t = {
          tag: t,
          create: a,
          deps: l,
          inst: r,
          next: null
        }, r = ne.updateQueue, r === null && (r = ja(), ne.updateQueue = r), a = r.lastEffect, a === null ? r.lastEffect = t.next = t : (l = a.next, a.next = t, t.next = l, r.lastEffect = t), t;
      }
      function Wa() {
        return He().memoizedState;
      }
      function Xl(t, r, a, l) {
        var c = Ln();
        ne.flags |= t, c.memoizedState = Kn(1 | r, {
          destroy: void 0
        }, a, l === void 0 ? null : l);
      }
      function Di(t, r, a, l) {
        var c = He();
        l = l === void 0 ? null : l;
        var d = c.memoizedState.inst;
        Ie !== null && l !== null && wo(l, Ie.memoizedState.deps) ? c.memoizedState = Kn(r, d, a, l) : (ne.flags |= t, c.memoizedState = Kn(1 | r, d, a, l));
      }
      function Bd(t, r) {
        Xl(8390656, 8, t, r);
      }
      function Tu(t, r) {
        Di(2048, 8, t, r);
      }
      function Ap(t) {
        ne.flags |= 4;
        var r = ne.updateQueue;
        if (r === null) r = ja(), ne.updateQueue = r, r.events = [t];else {
          var a = r.events;
          a === null ? r.events = [t] : a.push(t);
        }
      }
      function _u(t) {
        var r = He().memoizedState;
        return Ap({
          ref: r,
          nextImpl: t
        }), function () {
          if ((ce & 2) !== 0) throw Error(F(440));
          return r.impl.apply(void 0, arguments);
        };
      }
      function Od(t, r) {
        return Di(4, 2, t, r);
      }
      function Ru(t, r) {
        return Di(4, 4, t, r);
      }
      function jp(t, r) {
        if (typeof r == "function") {
          t = t();
          var a = r(t);
          return function () {
            typeof a == "function" ? a() : r(null);
          };
        }
        if (r != null) return t = t(), r.current = t, function () {
          r.current = null;
        };
      }
      function Md(t, r, a) {
        a = a != null ? a.concat([t]) : null, Di(4, 4, jp.bind(null, r, t), a);
      }
      function Qd() {}
      function Eu(t, r) {
        var a = He();
        r = r === void 0 ? null : r;
        var l = a.memoizedState;
        return r !== null && wo(r, l[1]) ? l[0] : (a.memoizedState = [t, r], t);
      }
      function Kl(t, r) {
        var a = He();
        r = r === void 0 ? null : r;
        var l = a.memoizedState;
        if (r !== null && wo(r, l[1])) return l[0];
        if (l = t(), oi) {
          pe(!0);
          try {
            t();
          } finally {
            pe(!1);
          }
        }
        return a.memoizedState = [l, r], l;
      }
      function Iu(t, r, a) {
        return a === void 0 || (Wo & 1073741824) !== 0 && (he & 261930) === 0 ? t.memoizedState = r : (t.memoizedState = a, t = ys(), ne.lanes |= t, ba |= t, a);
      }
      function es(t, r, a, l) {
        return jn(a, r) ? a : Kr.current !== null ? (t = Iu(t, a, l), jn(t, r) || (hn = !0), t) : (Wo & 42) === 0 || (Wo & 1073741824) !== 0 && (he & 261930) === 0 ? (hn = !0, t.memoizedState = a) : (t = ys(), ne.lanes |= t, ba |= t, r);
      }
      function $d(t, r, a, l, c) {
        var d = qr();
        yn(d !== 0 && 8 > d ? d : 8);
        var h = M.T,
          y = {};
        M.T = y, Wi(t, !1, r, a);
        try {
          var R = c(),
            L = M.S;
          if (L !== null && L(y, R), R !== null && typeof R == "object" && typeof R.then == "function") {
            var j = ho(R, l);
            ea(t, r, j, bt(t));
          } else ea(t, r, l, bt(t));
        } catch (A) {
          ea(t, r, {
            then: function () {},
            status: "rejected",
            reason: A
          }, bt());
        } finally {
          yn(d), h !== null && y.types !== null && (h.types = y.types), M.T = h;
        }
      }
      function Vd(t) {
        var r = t.memoizedState;
        if (r !== null) return r;
        r = {
          memoizedState: rt,
          baseState: rt,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Ar,
            lastRenderedState: rt
          },
          next: null
        };
        var a = {};
        return r.next = {
          memoizedState: a,
          baseState: a,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Ar,
            lastRenderedState: a
          },
          next: null
        }, t.memoizedState = r, t = t.alternate, t !== null && (t.memoizedState = r), r;
      }
      function Lu() {
        return In(da);
      }
      function xo() {
        return He().memoizedState;
      }
      function qd() {
        return He().memoizedState;
      }
      function Dp(t) {
        for (var r = t.return; r !== null;) {
          switch (r.tag) {
            case 24:
            case 3:
              var a = bt();
              t = Et(a);
              var l = Nr(r, t, a);
              l !== null && (nt(l, r, a), Ml(l, r, a)), r = {
                cache: Fd()
              }, t.payload = r;
              return;
          }
          r = r.return;
        }
      }
      function Nn(t, r, a) {
        var l = bt();
        a = {
          lane: l,
          revertLane: 0,
          gesture: null,
          action: a,
          hasEagerState: !1,
          eagerState: null,
          next: null
        }, na(t) ? Gd(r, a) : (a = yo(t, r, a, l), a !== null && (nt(a, t, l), ns(a, r, l)));
      }
      function Nu(t, r, a) {
        var l = bt();
        ea(t, r, a, l);
      }
      function ea(t, r, a, l) {
        var c = {
          lane: l,
          revertLane: 0,
          gesture: null,
          action: a,
          hasEagerState: !1,
          eagerState: null,
          next: null
        };
        if (na(t)) Gd(r, c);else {
          var d = t.alternate;
          if (t.lanes === 0 && (d === null || d.lanes === 0) && (d = r.lastRenderedReducer, d !== null)) try {
            var h = r.lastRenderedState,
              y = d(h, a);
            if (c.hasEagerState = !0, c.eagerState = y, jn(y, h)) return go(t, r, c, 0), Ne === null && Bn(), !1;
          } catch {} finally {}
          if (a = yo(t, r, c, l), a !== null) return nt(a, t, l), ns(a, r, l), !0;
        }
        return !1;
      }
      function Wi(t, r, a, l) {
        if (l = {
          lane: 2,
          revertLane: ku(),
          gesture: null,
          action: l,
          hasEagerState: !1,
          eagerState: null,
          next: null
        }, na(t)) {
          if (r) throw Error(F(479));
        } else r = yo(t, a, l, 2), r !== null && nt(r, t, 2);
      }
      function na(t) {
        var r = t.alternate;
        return t === ne || r !== null && r === ne;
      }
      function Gd(t, r) {
        dl = Uc = !0;
        var a = t.pending;
        a === null ? r.next = r : (r.next = a.next, a.next = r), t.pending = r;
      }
      function ns(t, r, a) {
        if ((a & 4194048) !== 0) {
          var l = r.lanes;
          l &= t.pendingLanes, a |= l, r.lanes = a, $e(t, a);
        }
      }
      function Fu(t, r, a, l) {
        r = t.memoizedState, a = a(l, r), a = a == null ? r : Lt({}, r, a), t.memoizedState = a, t.lanes === 0 && (t.updateQueue.baseState = a);
      }
      function ts(t, r, a, l, c, d, h) {
        return t = t.stateNode, typeof t.shouldComponentUpdate == "function" ? t.shouldComponentUpdate(l, d, h) : r.prototype && r.prototype.isPureReactComponent ? !Ul(a, l) || !Ul(c, d) : !0;
      }
      function Jd(t, r, a, l) {
        t = r.state, typeof r.componentWillReceiveProps == "function" && r.componentWillReceiveProps(a, l), typeof r.UNSAFE_componentWillReceiveProps == "function" && r.UNSAFE_componentWillReceiveProps(a, l), r.state !== t && Oc.enqueueReplaceState(r, r.state, null);
      }
      function Wr(t, r) {
        var a = r;
        if ("ref" in r) {
          a = {};
          for (var l in r) l !== "ref" && (a[l] = r[l]);
        }
        if (t = t.defaultProps) {
          a === r && (a = Lt({}, a));
          for (var c in t) a[c] === void 0 && (a[c] = t[c]);
        }
        return a;
      }
      function rs(t, r) {
        try {
          var a = t.onUncaughtError;
          a(r.value, {
            componentStack: r.stack
          });
        } catch (l) {
          setTimeout(function () {
            throw l;
          });
        }
      }
      function Zd(t, r, a) {
        try {
          var l = t.onCaughtError;
          l(a.value, {
            componentStack: a.stack,
            errorBoundary: r.tag === 1 ? r.stateNode : null
          });
        } catch (c) {
          setTimeout(function () {
            throw c;
          });
        }
      }
      function Ui(t, r, a) {
        return a = Et(a), a.tag = 3, a.payload = {
          element: null
        }, a.callback = function () {
          rs(t, r);
        }, a;
      }
      function os(t) {
        return t = Et(t), t.tag = 3, t;
      }
      function Hu(t, r, a, l) {
        var c = a.type.getDerivedStateFromError;
        if (typeof c == "function") {
          var d = l.value;
          t.payload = function () {
            return c(d);
          }, t.callback = function () {
            Zd(r, a, l);
          };
        }
        var h = a.stateNode;
        h !== null && typeof h.componentDidCatch == "function" && (t.callback = function () {
          Zd(r, a, l), typeof c != "function" && (va === null ? va = new Set([this]) : va.add(this));
          var y = l.stack;
          this.componentDidCatch(l.value, {
            componentStack: y !== null ? y : ""
          });
        });
      }
      function On(t, r, a, l, c) {
        if (a.flags |= 32768, l !== null && typeof l == "object" && typeof l.then == "function") {
          if (r = a.alternate, r !== null && po(r, a, c, !0), a = Ft.current, a !== null) {
            switch (a.tag) {
              case 31:
              case 13:
                return zr === null ? Gi() : a.alternate === null && Xe === 0 && (Xe = 3), a.flags &= -257, a.flags |= 65536, a.lanes = c, l === Dc ? a.flags |= 16384 : (r = a.updateQueue, r === null ? a.updateQueue = new Set([l]) : r.add(l), lc(t, l, c)), !1;
              case 22:
                return a.flags |= 65536, l === Dc ? a.flags |= 16384 : (r = a.updateQueue, r === null ? (r = {
                  transitions: null,
                  markerInstances: null,
                  retryQueue: new Set([l])
                }, a.updateQueue = r) : (a = r.retryQueue, a === null ? r.retryQueue = new Set([l]) : a.add(l)), lc(t, l, c)), !1;
            }
            throw Error(F(435, a.tag));
          }
          return lc(t, l, c), Gi(), !1;
        }
        if (ue) return r = Ft.current, r !== null ? ((r.flags & 65536) === 0 && (r.flags |= 256), r.flags |= 65536, r.lanes = c, l !== Of && (t = Error(F(422), {
          cause: l
        }), ct(ut(t, a)))) : (l !== Of && (r = Error(F(423), {
          cause: l
        }), ct(ut(r, a))), t = t.current.alternate, t.flags |= 65536, c &= -c, t.lanes |= c, l = ut(l, a), c = Ui(t.stateNode, l, c), jd(t, c), Xe !== 4 && (Xe = 2)), !1;
        var d = Error(F(520), {
          cause: l
        });
        if (d = ut(d, a), $s === null ? $s = [d] : $s.push(d), Xe !== 4 && (Xe = 2), r === null) return !0;
        l = ut(l, a), a = r;
        do {
          switch (a.tag) {
            case 3:
              return a.flags |= 65536, t = c & -c, a.lanes |= t, t = Ui(a.stateNode, l, t), jd(a, t), !1;
            case 1:
              if (r = a.type, d = a.stateNode, (a.flags & 128) === 0 && (typeof r.getDerivedStateFromError == "function" || d !== null && typeof d.componentDidCatch == "function" && (va === null || !va.has(d)))) return a.flags |= 65536, c &= -c, a.lanes |= c, c = os(c), Hu(c, t, a, l), jd(a, c), !1;
          }
          a = a.return;
        } while (a !== null);
        return !1;
      }
      function wn(t, r, a, l) {
        r.child = t === null ? Oh(r, null, a, l) : ri(r, t.child, a, l);
      }
      function as(t, r, a, l, c) {
        a = a.render;
        var d = r.ref;
        if ("ref" in l) {
          var h = {};
          for (var y in l) y !== "ref" && (h[y] = l[y]);
        } else h = l;
        return Un(r), l = $l(t, r, a, h, d, c), y = Hr(), t !== null && !hn ? (lr(t, r, c), gt(t, r, c)) : (ue && y && Id(r), r.flags |= 1, wn(t, r, l, c), r.child);
      }
      function Au(t, r, a, l, c) {
        if (t === null) {
          var d = a.type;
          return typeof d == "function" && !ks(d) && d.defaultProps === void 0 && a.compare === null ? (r.tag = 15, r.type = d, ju(t, r, d, l, c)) : (t = ws(a.type, null, l, r, r.mode, c), t.ref = r.ref, t.return = r, r.child = t);
        }
        if (d = t.child, !Mi(t, c)) {
          var h = d.memoizedProps;
          if (a = a.compare, a = a !== null ? a : Ul, a(h, l) && t.ref === r.ref) return gt(t, r, c);
        }
        return r.flags |= 1, t = Qr(d, l), t.ref = r.ref, t.return = r, r.child = t;
      }
      function ju(t, r, a, l, c) {
        if (t !== null) {
          var d = t.memoizedProps;
          if (Ul(d, l) && t.ref === r.ref) if (hn = !1, r.pendingProps = l = d, Mi(t, c)) (t.flags & 131072) !== 0 && (hn = !0);else return r.lanes = t.lanes, gt(t, r, c);
        }
        return Yd(t, r, a, l, c);
      }
      function zo(t, r, a, l) {
        var c = l.children,
          d = t !== null ? t.memoizedState : null;
        if (t === null && r.stateNode === null && (r.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        }), l.mode === "hidden") {
          if ((r.flags & 128) !== 0) {
            if (d = d !== null ? d.baseLanes | a : a, t !== null) {
              for (l = r.child = t.child, c = 0; l !== null;) c = c | l.lanes | l.childLanes, l = l.sibling;
              l = c & ~d;
            } else l = 0, r.child = null;
            return Bi(t, r, d, a, l);
          }
          if ((a & 536870912) !== 0) r.memoizedState = {
            baseLanes: 0,
            cachePool: null
          }, t !== null && Ei(r, d !== null ? d.cachePool : null), d !== null ? B(r, d) : Ql(), Fr(r);else return l = r.lanes = 536870912, Bi(t, r, d !== null ? d.baseLanes | a : a, a, l);
        } else d !== null ? (Ei(r, d.cachePool), B(r, d), So(), r.memoizedState = null) : (t !== null && Ei(r, null), Ql(), So());
        return wn(t, r, c, a), r.child;
      }
      function Mt(t, r) {
        return t !== null && t.tag === 22 || r.stateNode !== null || (r.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        }), r.sibling;
      }
      function Bi(t, r, a, l, c) {
        var d = wu();
        return d = d === null ? null : {
          parent: qt ? qe._currentValue : qe._currentValue2,
          pool: d
        }, r.memoizedState = {
          baseLanes: a,
          cachePool: d
        }, t !== null && Ei(r, null), Ql(), Fr(r), t !== null && po(t, r, l, !0), r.childLanes = c, null;
      }
      function Ua(t, r) {
        return r = mr({
          mode: r.mode,
          children: r.children
        }, t.mode), r.ref = t.ref, t.child = r, r.return = t, r;
      }
      function Oi(t, r, a) {
        return ri(r, t.child, null, a), t = Ua(r, r.pendingProps), t.flags |= 2, ht(r), r.memoizedState = null, t;
      }
      function is(t, r, a) {
        var l = r.pendingProps,
          c = (r.flags & 128) !== 0;
        if (r.flags &= -129, t === null) {
          if (ue) {
            if (l.mode === "hidden") return t = Ua(r, l), r.lanes = 536870912, Mt(null, t);
            if (Ni(r), (t = Ue) ? (t = xh(t, Yt), t !== null && (r.memoizedState = {
              dehydrated: t,
              treeContext: jo !== null ? {
                id: ot,
                overflow: Zr
              } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, a = cc(t), a.return = r, r.child = a, bn = r, Ue = null)) : t = null, t === null) throw ar(r);
            return r.lanes = 536870912, null;
          }
          return Ua(r, l);
        }
        var d = t.memoizedState;
        if (d !== null) {
          var h = d.dehydrated;
          if (Ni(r), c) {
            if (r.flags & 256) r.flags &= -257, r = Oi(t, r, a);else if (r.memoizedState !== null) r.child = t.child, r.flags |= 128, r = null;else throw Error(F(558));
          } else if (hn || po(t, r, a, !1), c = (a & t.childLanes) !== 0, hn || c) {
            if (l = Ne, l !== null && (h = G(l, a), h !== 0 && h !== d.retryLane)) throw d.retryLane = h, Ko(t, h), nt(l, t, h), Mc;
            Gi(), r = Oi(t, r, a);
          } else t = d.treeContext, Hn && (Ue = Ff(h), bn = r, ue = !0, Do = null, Yt = !1, t !== null && Ld(r, t)), r = Ua(r, l), r.flags |= 4096;
          return r;
        }
        return t = Qr(t.child, {
          mode: l.mode,
          children: l.children
        }), t.ref = r.ref, r.child = t, t.return = r, t;
      }
      function ls(t, r) {
        var a = r.ref;
        if (a === null) t !== null && t.ref !== null && (r.flags |= 4194816);else {
          if (typeof a != "function" && typeof a != "object") throw Error(F(284));
          (t === null || t.ref !== a) && (r.flags |= 4194816);
        }
      }
      function Yd(t, r, a, l, c) {
        return Un(r), a = $l(t, r, a, l, void 0, c), l = Hr(), t !== null && !hn ? (lr(t, r, c), gt(t, r, c)) : (ue && l && Id(r), r.flags |= 1, wn(t, r, a, c), r.child);
      }
      function Xd(t, r, a, l, c, d) {
        return Un(r), r.updateQueue = null, a = xu(r, l, a, c), Fi(t), l = Hr(), t !== null && !hn ? (lr(t, r, d), gt(t, r, d)) : (ue && l && Id(r), r.flags |= 1, wn(t, r, a, d), r.child);
      }
      function Kd(t, r, a, l, c) {
        if (Un(r), r.stateNode === null) {
          var d = Ka,
            h = a.contextType;
          typeof h == "object" && h !== null && (d = In(h)), d = new a(l, d), r.memoizedState = d.state !== null && d.state !== void 0 ? d.state : null, d.updater = Oc, r.stateNode = d, d._reactInternals = r, d = r.stateNode, d.props = l, d.state = r.memoizedState, d.refs = {}, Ol(r), h = a.contextType, d.context = typeof h == "object" && h !== null ? In(h) : Ka, d.state = r.memoizedState, h = a.getDerivedStateFromProps, typeof h == "function" && (Fu(r, a, h, l), d.state = r.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof d.getSnapshotBeforeUpdate == "function" || typeof d.UNSAFE_componentWillMount != "function" && typeof d.componentWillMount != "function" || (h = d.state, typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), h !== d.state && Oc.enqueueReplaceState(d, d.state, null), Aa(r, l, d, c), Li(), d.state = r.memoizedState), typeof d.componentDidMount == "function" && (r.flags |= 4194308), l = !0;
        } else if (t === null) {
          d = r.stateNode;
          var y = r.memoizedProps,
            R = Wr(a, y);
          d.props = R;
          var L = d.context,
            j = a.contextType;
          h = Ka, typeof j == "object" && j !== null && (h = In(j));
          var A = a.getDerivedStateFromProps;
          j = typeof A == "function" || typeof d.getSnapshotBeforeUpdate == "function", y = r.pendingProps !== y, j || typeof d.UNSAFE_componentWillReceiveProps != "function" && typeof d.componentWillReceiveProps != "function" || (y || L !== h) && Jd(r, d, l, h), ma = !1;
          var W = r.memoizedState;
          d.state = W, Aa(r, l, d, c), Li(), L = r.memoizedState, y || W !== L || ma ? (typeof A == "function" && (Fu(r, a, A, l), L = r.memoizedState), (R = ma || ts(r, a, R, l, W, L, h)) ? (j || typeof d.UNSAFE_componentWillMount != "function" && typeof d.componentWillMount != "function" || (typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount()), typeof d.componentDidMount == "function" && (r.flags |= 4194308)) : (typeof d.componentDidMount == "function" && (r.flags |= 4194308), r.memoizedProps = l, r.memoizedState = L), d.props = l, d.state = L, d.context = h, l = R) : (typeof d.componentDidMount == "function" && (r.flags |= 4194308), l = !1);
        } else {
          d = r.stateNode, Ha(t, r), h = r.memoizedProps, j = Wr(a, h), d.props = j, A = r.pendingProps, W = d.context, L = a.contextType, R = Ka, typeof L == "object" && L !== null && (R = In(L)), y = a.getDerivedStateFromProps, (L = typeof y == "function" || typeof d.getSnapshotBeforeUpdate == "function") || typeof d.UNSAFE_componentWillReceiveProps != "function" && typeof d.componentWillReceiveProps != "function" || (h !== A || W !== R) && Jd(r, d, l, R), ma = !1, W = r.memoizedState, d.state = W, Aa(r, l, d, c), Li();
          var V = r.memoizedState;
          h !== A || W !== V || ma || t !== null && t.dependencies !== null && Ri(t.dependencies) ? (typeof y == "function" && (Fu(r, a, y, l), V = r.memoizedState), (j = ma || ts(r, a, j, l, W, V, R) || t !== null && t.dependencies !== null && Ri(t.dependencies)) ? (L || typeof d.UNSAFE_componentWillUpdate != "function" && typeof d.componentWillUpdate != "function" || (typeof d.componentWillUpdate == "function" && d.componentWillUpdate(l, V, R), typeof d.UNSAFE_componentWillUpdate == "function" && d.UNSAFE_componentWillUpdate(l, V, R)), typeof d.componentDidUpdate == "function" && (r.flags |= 4), typeof d.getSnapshotBeforeUpdate == "function" && (r.flags |= 1024)) : (typeof d.componentDidUpdate != "function" || h === t.memoizedProps && W === t.memoizedState || (r.flags |= 4), typeof d.getSnapshotBeforeUpdate != "function" || h === t.memoizedProps && W === t.memoizedState || (r.flags |= 1024), r.memoizedProps = l, r.memoizedState = V), d.props = l, d.state = V, d.context = R, l = j) : (typeof d.componentDidUpdate != "function" || h === t.memoizedProps && W === t.memoizedState || (r.flags |= 4), typeof d.getSnapshotBeforeUpdate != "function" || h === t.memoizedProps && W === t.memoizedState || (r.flags |= 1024), l = !1);
        }
        return d = l, ls(t, r), l = (r.flags & 128) !== 0, d || l ? (d = r.stateNode, a = l && typeof a.getDerivedStateFromError != "function" ? null : d.render(), r.flags |= 1, t !== null && l ? (r.child = ri(r, t.child, null, c), r.child = ri(r, null, a, c)) : wn(t, r, a, c), r.memoizedState = d.state, t = r.child) : t = gt(t, r, c), t;
      }
      function Du(t, r, a, l) {
        return _a(), r.flags |= 256, wn(t, r, a, l), r.child;
      }
      function ss(t) {
        return {
          baseLanes: t,
          cachePool: Pu()
        };
      }
      function Ur(t, r, a) {
        return t = t !== null ? t.childLanes & ~a : 0, r && (t |= At), t;
      }
      function Wu(t, r, a) {
        var l = r.pendingProps,
          c = !1,
          d = (r.flags & 128) !== 0,
          h;
        if ((h = d) || (h = t !== null && t.memoizedState === null ? !1 : (ln.current & 2) !== 0), h && (c = !0, r.flags &= -129), h = (r.flags & 32) !== 0, r.flags &= -33, t === null) {
          if (ue) {
            if (c ? vo(r) : So(), (t = Ue) ? (t = Om(t, Yt), t !== null && (r.memoizedState = {
              dehydrated: t,
              treeContext: jo !== null ? {
                id: ot,
                overflow: Zr
              } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, a = cc(t), a.return = r, r.child = a, bn = r, Ue = null)) : t = null, t === null) throw ar(r);
            return Fs(t) ? r.lanes = 32 : r.lanes = 536870912, null;
          }
          var y = l.children;
          return l = l.fallback, c ? (So(), c = r.mode, y = mr({
            mode: "hidden",
            children: y
          }, c), l = Eo(l, c, a, null), y.return = r, l.return = r, y.sibling = l, r.child = y, l = r.child, l.memoizedState = ss(a), l.childLanes = Ur(t, h, a), r.memoizedState = Qc, Mt(null, l)) : (vo(r), Uu(r, y));
        }
        var R = t.memoizedState;
        if (R !== null && (y = R.dehydrated, y !== null)) {
          if (d) r.flags & 256 ? (vo(r), r.flags &= -257, r = et(t, r, a)) : r.memoizedState !== null ? (So(), r.child = t.child, r.flags |= 128, r = null) : (So(), y = l.fallback, c = r.mode, l = mr({
            mode: "visible",
            children: l.children
          }, c), y = Eo(y, c, a, null), y.flags |= 2, l.return = r, y.return = r, l.sibling = y, r.child = l, ri(r, t.child, null, a), l = r.child, l.memoizedState = ss(a), l.childLanes = Ur(t, h, a), r.memoizedState = Qc, r = Mt(null, l));else if (vo(r), Fs(y)) h = Za(y).digest, l = Error(F(419)), l.stack = "", l.digest = h, ct({
            value: l,
            source: null,
            stack: null
          }), r = et(t, r, a);else if (hn || po(t, r, a, !1), h = (a & t.childLanes) !== 0, hn || h) {
            if (h = Ne, h !== null && (l = G(h, a), l !== 0 && l !== R.retryLane)) throw R.retryLane = l, Ko(t, l), nt(h, t, l), Mc;
            Ns(y) || Gi(), r = et(t, r, a);
          } else Ns(y) ? (r.flags |= 192, r.child = t.child, r = null) : (t = R.treeContext, Hn && (Ue = wh(y), bn = r, ue = !0, Do = null, Yt = !1, t !== null && Ld(r, t)), r = Uu(r, l.children), r.flags |= 4096);
          return r;
        }
        return c ? (So(), y = l.fallback, c = r.mode, R = t.child, d = R.sibling, l = Qr(R, {
          mode: "hidden",
          children: l.children
        }), l.subtreeFlags = R.subtreeFlags & 65011712, d !== null ? y = Qr(d, y) : (y = Eo(y, c, a, null), y.flags |= 2), y.return = r, l.return = r, l.sibling = y, r.child = l, Mt(null, l), l = r.child, y = t.child.memoizedState, y === null ? y = ss(a) : (c = y.cachePool, c !== null ? (R = qt ? qe._currentValue : qe._currentValue2, c = c.parent !== R ? {
          parent: R,
          pool: R
        } : c) : c = Pu(), y = {
          baseLanes: y.baseLanes | a,
          cachePool: c
        }), l.memoizedState = y, l.childLanes = Ur(t, h, a), r.memoizedState = Qc, Mt(t.child, l)) : (vo(r), a = t.child, t = a.sibling, a = Qr(a, {
          mode: "visible",
          children: l.children
        }), a.return = r, a.sibling = null, t !== null && (h = r.deletions, h === null ? (r.deletions = [t], r.flags |= 16) : h.push(t)), r.child = a, r.memoizedState = null, a);
      }
      function Uu(t, r) {
        return r = mr({
          mode: "visible",
          children: r
        }, t.mode), r.return = t, t.child = r;
      }
      function mr(t, r) {
        return t = Yn(22, t, null, r), t.lanes = 0, t;
      }
      function et(t, r, a) {
        return ri(r, t.child, null, a), t = Uu(r, r.pendingProps.children), t.flags |= 2, r.memoizedState = null, t;
      }
      function us(t, r, a) {
        t.lanes |= r;
        var l = t.alternate;
        l !== null && (l.lanes |= r), Ot(t.return, r, a);
      }
      function ee(t, r, a, l, c, d) {
        var h = t.memoizedState;
        h === null ? t.memoizedState = {
          isBackwards: r,
          rendering: null,
          renderingStartTime: 0,
          last: l,
          tail: a,
          tailMode: c,
          treeForkCount: d
        } : (h.isBackwards = r, h.rendering = null, h.renderingStartTime = 0, h.last = l, h.tail = a, h.tailMode = c, h.treeForkCount = d);
      }
      function N(t, r, a) {
        var l = r.pendingProps,
          c = l.revealOrder,
          d = l.tail;
        l = l.children;
        var h = ln.current,
          y = (h & 2) !== 0;
        if (y ? (h = h & 1 | 2, r.flags |= 128) : h &= 1, Ce(ln, h), wn(t, r, l, a), l = ue ? x : 0, !y && t !== null && (t.flags & 128) !== 0) e: for (t = r.child; t !== null;) {
          if (t.tag === 13) t.memoizedState !== null && us(t, a, r);else if (t.tag === 19) us(t, a, r);else if (t.child !== null) {
            t.child.return = t, t = t.child;
            continue;
          }
          if (t === r) break e;
          for (; t.sibling === null;) {
            if (t.return === null || t.return === r) break e;
            t = t.return;
          }
          t.sibling.return = t.return, t = t.sibling;
        }
        switch (c) {
          case "forwards":
            for (a = r.child, c = null; a !== null;) t = a.alternate, t !== null && ko(t) === null && (c = a), a = a.sibling;
            a = c, a === null ? (c = r.child, r.child = null) : (c = a.sibling, a.sibling = null), ee(r, !1, c, a, d, l);
            break;
          case "backwards":
          case "unstable_legacy-backwards":
            for (a = null, c = r.child, r.child = null; c !== null;) {
              if (t = c.alternate, t !== null && ko(t) === null) {
                r.child = c;
                break;
              }
              t = c.sibling, c.sibling = a, a = c, c = t;
            }
            ee(r, !0, a, null, d, l);
            break;
          case "together":
            ee(r, !1, null, null, void 0, l);
            break;
          default:
            r.memoizedState = null;
        }
        return r.child;
      }
      function gt(t, r, a) {
        if (t !== null && (r.dependencies = t.dependencies), ba |= r.lanes, (a & r.childLanes) === 0) if (t !== null) {
          if (po(t, r, a, !1), (a & r.childLanes) === 0) return null;
        } else return null;
        if (t !== null && r.child !== t.child) throw Error(F(153));
        if (r.child !== null) {
          for (t = r.child, a = Qr(t, t.pendingProps), r.child = a, a.return = r; t.sibling !== null;) t = t.sibling, a = a.sibling = Qr(t, t.pendingProps), a.return = r;
          a.sibling = null;
        }
        return r.child;
      }
      function Mi(t, r) {
        return (t.lanes & r) !== 0 ? !0 : (t = t.dependencies, !!(t !== null && Ri(t)));
      }
      function Ye(t, r, a) {
        switch (r.tag) {
          case 3:
            Al(r, r.stateNode.containerInfo), fo(r, qe, t.memoizedState.cache), _a();
            break;
          case 27:
          case 5:
            yu(r);
            break;
          case 4:
            Al(r, r.stateNode.containerInfo);
            break;
          case 10:
            fo(r, r.type, r.memoizedProps.value);
            break;
          case 31:
            if (r.memoizedState !== null) return r.flags |= 128, Ni(r), null;
            break;
          case 13:
            var l = r.memoizedState;
            if (l !== null) return l.dehydrated !== null ? (vo(r), r.flags |= 128, null) : (a & r.child.childLanes) !== 0 ? Wu(t, r, a) : (vo(r), t = gt(t, r, a), t !== null ? t.sibling : null);
            vo(r);
            break;
          case 19:
            var c = (t.flags & 128) !== 0;
            if (l = (a & r.childLanes) !== 0, l || (po(t, r, a, !1), l = (a & r.childLanes) !== 0), c) {
              if (l) return N(t, r, a);
              r.flags |= 128;
            }
            if (c = r.memoizedState, c !== null && (c.rendering = null, c.tail = null, c.lastEffect = null), Ce(ln, ln.current), l) break;
            return null;
          case 22:
            return r.lanes = 0, zo(t, r, a, r.pendingProps);
          case 24:
            fo(r, qe, t.memoizedState.cache);
        }
        return gt(t, r, a);
      }
      function Bu(t, r, a) {
        if (t !== null) {
          if (t.memoizedProps !== r.pendingProps) hn = !0;else {
            if (!Mi(t, a) && (r.flags & 128) === 0) return hn = !1, Ye(t, r, a);
            hn = (t.flags & 131072) !== 0;
          }
        } else hn = !1, ue && (r.flags & 1048576) !== 0 && Ci(r, x, r.index);
        switch (r.lanes = 0, r.tag) {
          case 16:
            e: {
              var l = r.pendingProps;
              if (t = pt(r.elementType), r.type = t, typeof t == "function") ks(t) ? (l = Wr(t, l), r.tag = 1, r = Kd(null, r, t, l, a)) : (r.tag = 0, r = Yd(null, r, t, l, a));else {
                if (t != null) {
                  var c = t.$$typeof;
                  if (c === Zi) {
                    r.tag = 11, r = as(null, r, t, l, a);
                    break e;
                  } else if (c === wf) {
                    r.tag = 14, r = Au(null, r, t, l, a);
                    break e;
                  }
                }
                throw r = hu(t) || t, Error(F(306, r, ""));
              }
            }
            return r;
          case 0:
            return Yd(t, r, r.type, r.pendingProps, a);
          case 1:
            return l = r.type, c = Wr(l, r.pendingProps), Kd(t, r, l, c, a);
          case 3:
            e: {
              if (Al(r, r.stateNode.containerInfo), t === null) throw Error(F(387));
              var d = r.pendingProps;
              c = r.memoizedState, l = c.element, Ha(t, r), Aa(r, d, null, a);
              var h = r.memoizedState;
              if (d = h.cache, fo(r, qe, d), d !== c.cache && _i(r, [qe], a, !0), Li(), d = h.element, Hn && c.isDehydrated) {
                if (c = {
                  element: d,
                  isDehydrated: !1,
                  cache: h.cache
                }, r.updateQueue.baseState = c, r.memoizedState = c, r.flags & 256) {
                  r = Du(t, r, d, a);
                  break e;
                } else if (d !== l) {
                  l = ut(Error(F(424)), r), ct(l), r = Du(t, r, d, a);
                  break e;
                } else for (Hn && (Ue = Pc(r.stateNode.containerInfo), bn = r, ue = !0, Do = null, Yt = !0), a = Oh(r, null, d, a), r.child = a; a;) a.flags = a.flags & -3 | 4096, a = a.sibling;
              } else {
                if (_a(), d === l) {
                  r = gt(t, r, a);
                  break e;
                }
                wn(t, r, d, a);
              }
              r = r.child;
            }
            return r;
          case 26:
            if (Gt) return ls(t, r), t === null ? (a = nl(r.type, null, r.pendingProps, null)) ? r.memoizedState = a : ue || (r.stateNode = Ah(r.type, r.pendingProps, pa.current, r)) : r.memoizedState = nl(r.type, t.memoizedProps, r.pendingProps, t.memoizedState), null;
          case 27:
            if (dn) return yu(r), t === null && dn && ue && (l = r.stateNode = _c(r.type, r.pendingProps, pa.current, Dn.current, !1), bn = r, Yt = !0, Ue = Um(r.type, l, Ue)), wn(t, r, r.pendingProps.children, a), ls(t, r), t === null && (r.flags |= 4194304), r.child;
          case 5:
            return t === null && ue && ($m(r.type, r.pendingProps, Dn.current), (c = l = Ue) && (l = Bm(l, r.type, r.pendingProps, Yt), l !== null ? (r.stateNode = l, bn = r, Ue = wc(l), Yt = !1, c = !0) : c = !1), c || ar(r)), yu(r), c = r.type, d = r.pendingProps, h = t !== null ? t.memoizedProps : null, l = d.children, Rs(c, d) ? l = null : h !== null && Rs(c, h) && (r.flags |= 32), r.memoizedState !== null && (c = $l(t, r, zu, null, null, a), qt ? da._currentValue = c : da._currentValue2 = c), ls(t, r), wn(t, r, l, a), r.child;
          case 6:
            return t === null && ue && (jf(r.pendingProps, Dn.current), (t = a = Ue) && (a = Ph(a, r.pendingProps, Yt), a !== null ? (r.stateNode = a, bn = r, Ue = null, t = !0) : t = !1), t || ar(r)), null;
          case 13:
            return Wu(t, r, a);
          case 4:
            return Al(r, r.stateNode.containerInfo), l = r.pendingProps, t === null ? r.child = ri(r, null, l, a) : wn(t, r, l, a), r.child;
          case 11:
            return as(t, r, r.type, r.pendingProps, a);
          case 7:
            return wn(t, r, r.pendingProps, a), r.child;
          case 8:
            return wn(t, r, r.pendingProps.children, a), r.child;
          case 12:
            return wn(t, r, r.pendingProps.children, a), r.child;
          case 10:
            return l = r.pendingProps, fo(r, r.type, l.value), wn(t, r, l.children, a), r.child;
          case 9:
            return c = r.type._context, l = r.pendingProps.children, Un(r), c = In(c), l = l(c), r.flags |= 1, wn(t, r, l, a), r.child;
          case 14:
            return Au(t, r, r.type, r.pendingProps, a);
          case 15:
            return ju(t, r, r.type, r.pendingProps, a);
          case 19:
            return N(t, r, a);
          case 31:
            return is(t, r, a);
          case 22:
            return zo(t, r, a, r.pendingProps);
          case 24:
            return Un(r), l = In(qe), t === null ? (c = wu(), c === null && (c = Ne, d = Fd(), c.pooledCache = d, d.refCount++, d !== null && (c.pooledCacheLanes |= a), c = d), r.memoizedState = {
              parent: l,
              cache: c
            }, Ol(r), fo(r, qe, c)) : ((t.lanes & a) !== 0 && (Ha(t, r), Aa(r, null, null, a), Li()), c = t.memoizedState, d = r.memoizedState, c.parent !== l ? (c = {
              parent: l,
              cache: l
            }, r.memoizedState = c, r.lanes === 0 && (r.memoizedState = r.updateQueue.baseState = c), fo(r, qe, l)) : (l = d.cache, fo(r, qe, l), l !== c.cache && _i(r, [qe], a, !0))), wn(t, r, r.pendingProps.children, a), r.child;
          case 29:
            throw r.pendingProps;
        }
        throw Error(F(156, r.tag));
      }
      function It(t) {
        t.flags |= 4;
      }
      function cs(t) {
        Sr && (t.flags |= 8);
      }
      function Ou(t, r) {
        if (t !== null && t.child === r.child) return !1;
        if ((r.flags & 16) !== 0) return !0;
        for (t = r.child; t !== null;) {
          if ((t.flags & 8218) !== 0 || (t.subtreeFlags & 8218) !== 0) return !0;
          t = t.sibling;
        }
        return !1;
      }
      function ef(t, r, a, l) {
        if ($n) for (a = r.child; a !== null;) {
          if (a.tag === 5 || a.tag === 6) yc(t, a.stateNode);else if (!(a.tag === 4 || dn && a.tag === 27) && a.child !== null) {
            a.child.return = a, a = a.child;
            continue;
          }
          if (a === r) break;
          for (; a.sibling === null;) {
            if (a.return === null || a.return === r) return;
            a = a.return;
          }
          a.sibling.return = a.return, a = a.sibling;
        } else if (Sr) for (var c = r.child; c !== null;) {
          if (c.tag === 5) {
            var d = c.stateNode;
            a && l && (d = No(d, c.type, c.memoizedProps)), yc(t, d);
          } else if (c.tag === 6) d = c.stateNode, a && l && (d = Ls(d, c.memoizedProps)), yc(t, d);else if (c.tag !== 4) {
            if (c.tag === 22 && c.memoizedState !== null) d = c.child, d !== null && (d.return = c), ef(t, c, !0, !0);else if (c.child !== null) {
              c.child.return = c, c = c.child;
              continue;
            }
          }
          if (c === r) break;
          for (; c.sibling === null;) {
            if (c.return === null || c.return === r) return;
            c = c.return;
          }
          c.sibling.return = c.return, c = c.sibling;
        }
      }
      function Mu(t, r, a, l) {
        var c = !1;
        if (Sr) for (var d = r.child; d !== null;) {
          if (d.tag === 5) {
            var h = d.stateNode;
            a && l && (h = No(h, d.type, d.memoizedProps)), Lf(t, h);
          } else if (d.tag === 6) h = d.stateNode, a && l && (h = Ls(h, d.memoizedProps)), Lf(t, h);else if (d.tag !== 4) {
            if (d.tag === 22 && d.memoizedState !== null) c = d.child, c !== null && (c.return = d), Mu(t, d, !0, !0), c = !0;else if (d.child !== null) {
              d.child.return = d, d = d.child;
              continue;
            }
          }
          if (d === r) break;
          for (; d.sibling === null;) {
            if (d.return === null || d.return === r) return c;
            d = d.return;
          }
          d.sibling.return = d.return, d = d.sibling;
        }
        return c;
      }
      function Qu(t, r) {
        if (Sr && Ou(t, r)) {
          t = r.stateNode;
          var a = t.containerInfo,
            l = We();
          Mu(l, r, !1, !1), t.pendingChildren = l, It(r), yh(a, l);
        }
      }
      function ds(t, r, a, l) {
        if ($n) t.memoizedProps !== l && It(r);else if (Sr) {
          var c = t.stateNode,
            d = t.memoizedProps;
          if ((t = Ou(t, r)) || d !== l) {
            var h = Dn.current;
            d = gh(c, a, d, l, !t, null), d === c ? r.stateNode = c : (cs(r), Kp(d, a, l, h) && It(r), r.stateNode = d, t && ef(d, r, !1, !1));
          } else r.stateNode = c;
        }
      }
      function Fn(t, r, a, l, c) {
        if ((t.mode & 32) !== 0 && (a === null ? rh(r, l) : Dm(r, a, l))) {
          if (t.flags |= 16777216, (c & 335544128) === c || Yi(r, l)) if (An(t.stateNode, r, l)) t.flags |= 8192;else if (Vp()) t.flags |= 8192;else throw Xt = Dc, Ac;
        } else t.flags &= -16777217;
      }
      function xe(t, r) {
        if (Vm(r)) {
          if (t.flags |= 16777216, !Tc(r)) if (Vp()) t.flags |= 8192;else throw Xt = Dc, Ac;
        } else t.flags &= -16777217;
      }
      function Ba(t, r) {
        r !== null && (t.flags |= 4), t.flags & 16384 && (r = t.tag !== 22 ? Ed() : 536870912, t.lanes |= r, hl |= r);
      }
      function Co(t, r) {
        if (!ue) switch (t.tailMode) {
          case "hidden":
            r = t.tail;
            for (var a = null; r !== null;) r.alternate !== null && (a = r), r = r.sibling;
            a === null ? t.tail = null : a.sibling = null;
            break;
          case "collapsed":
            a = t.tail;
            for (var l = null; a !== null;) a.alternate !== null && (l = a), a = a.sibling;
            l === null ? r || t.tail === null ? t.tail = null : t.tail.sibling = null : l.sibling = null;
        }
      }
      function we(t) {
        var r = t.alternate !== null && t.alternate.child === t.child,
          a = 0,
          l = 0;
        if (r) for (var c = t.child; c !== null;) a |= c.lanes | c.childLanes, l |= c.subtreeFlags & 65011712, l |= c.flags & 65011712, c.return = t, c = c.sibling;else for (c = t.child; c !== null;) a |= c.lanes | c.childLanes, l |= c.subtreeFlags, l |= c.flags, c.return = t, c = c.sibling;
        return t.subtreeFlags |= l, t.childLanes = a, r;
      }
      function Oa(t, r, a) {
        var l = r.pendingProps;
        switch (gu(r), r.tag) {
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return we(r), null;
          case 1:
            return we(r), null;
          case 3:
            return a = r.stateNode, l = null, t !== null && (l = t.memoizedState.cache), r.memoizedState.cache !== l && (r.flags |= 2048), En(qe), Xo(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (t === null || t.child === null) && (Ti(r) ? It(r) : t === null || t.memoizedState.isDehydrated && (r.flags & 256) === 0 || (r.flags |= 1024, Dl())), Qu(t, r), we(r), null;
          case 26:
            if (Gt) {
              var c = r.type,
                d = r.memoizedState;
              return t === null ? (It(r), d !== null ? (we(r), xe(r, d)) : (we(r), Fn(r, c, null, l, a))) : d ? d !== t.memoizedState ? (It(r), we(r), xe(r, d)) : (we(r), r.flags &= -16777217) : (d = t.memoizedProps, $n ? d !== l && It(r) : ds(t, r, c, l), we(r), Fn(r, c, d, l, a)), null;
            }
          case 27:
            if (dn) {
              if (jl(r), a = pa.current, c = r.type, t !== null && r.stateNode != null) $n ? t.memoizedProps !== l && It(r) : ds(t, r, c, l);else {
                if (!l) {
                  if (r.stateNode === null) throw Error(F(166));
                  return we(r), null;
                }
                t = Dn.current, Ti(r) ? Ep(r, t) : (t = _c(c, l, a, t, !0), r.stateNode = t, It(r));
              }
              return we(r), null;
            }
          case 5:
            if (jl(r), c = r.type, t !== null && r.stateNode != null) ds(t, r, c, l);else {
              if (!l) {
                if (r.stateNode === null) throw Error(F(166));
                return we(r), null;
              }
              if (d = Dn.current, Ti(r)) Ep(r, d), Eh(r.stateNode, c, l, d) && (r.flags |= 64);else {
                var h = Vr(c, l, pa.current, d, r);
                cs(r), ef(h, r, !1, !1), r.stateNode = h, Kp(h, c, l, d) && It(r);
              }
            }
            return we(r), Fn(r, r.type, t === null ? null : t.memoizedProps, r.pendingProps, a), null;
          case 6:
            if (t && r.stateNode != null) a = t.memoizedProps, $n ? a !== l && It(r) : Sr && (a !== l ? (t = pa.current, a = Dn.current, cs(r), r.stateNode = bc(l, t, a, r)) : r.stateNode = t.stateNode);else {
              if (typeof l != "string" && r.stateNode === null) throw Error(F(166));
              if (t = pa.current, a = Dn.current, Ti(r)) {
                if (!Hn) throw Error(F(176));
                if (t = r.stateNode, a = r.memoizedProps, l = null, c = bn, c !== null) switch (c.tag) {
                  case 27:
                  case 5:
                    l = c.memoizedProps;
                }
                xc(t, a, r, l) || ar(r, !0);
              } else cs(r), r.stateNode = bc(l, t, a, r);
            }
            return we(r), null;
          case 31:
            if (a = r.memoizedState, t === null || t.memoizedState !== null) {
              if (l = Ti(r), a !== null) {
                if (t === null) {
                  if (!l) throw Error(F(318));
                  if (!Hn) throw Error(F(556));
                  if (t = r.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(F(557));
                  zh(t, r);
                } else _a(), (r.flags & 128) === 0 && (r.memoizedState = null), r.flags |= 4;
                we(r), t = !1;
              } else a = Dl(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = a), t = !0;
              if (!t) return r.flags & 256 ? (ht(r), r) : (ht(r), null);
              if ((r.flags & 128) !== 0) throw Error(F(558));
            }
            return we(r), null;
          case 13:
            if (l = r.memoizedState, t === null || t.memoizedState !== null && t.memoizedState.dehydrated !== null) {
              if (c = Ti(r), l !== null && l.dehydrated !== null) {
                if (t === null) {
                  if (!c) throw Error(F(318));
                  if (!Hn) throw Error(F(344));
                  if (c = r.memoizedState, c = c !== null ? c.dehydrated : null, !c) throw Error(F(317));
                  Hf(c, r);
                } else _a(), (r.flags & 128) === 0 && (r.memoizedState = null), r.flags |= 4;
                we(r), c = !1;
              } else c = Dl(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = c), c = !0;
              if (!c) return r.flags & 256 ? (ht(r), r) : (ht(r), null);
            }
            return ht(r), (r.flags & 128) !== 0 ? (r.lanes = a, r) : (a = l !== null, t = t !== null && t.memoizedState !== null, a && (l = r.child, c = null, l.alternate !== null && l.alternate.memoizedState !== null && l.alternate.memoizedState.cachePool !== null && (c = l.alternate.memoizedState.cachePool.pool), d = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (d = l.memoizedState.cachePool.pool), d !== c && (l.flags |= 2048)), a !== t && a && (r.child.flags |= 8192), Ba(r, r.updateQueue), we(r), null);
          case 4:
            return Xo(), Qu(t, r), t === null && jm(r.stateNode.containerInfo), we(r), null;
          case 10:
            return En(r.type), we(r), null;
          case 19:
            if (D(ln), l = r.memoizedState, l === null) return we(r), null;
            if (c = (r.flags & 128) !== 0, d = l.rendering, d === null) {
              if (c) Co(l, !1);else {
                if (Xe !== 0 || t !== null && (t.flags & 128) !== 0) for (t = r.child; t !== null;) {
                  if (d = ko(t), d !== null) {
                    for (r.flags |= 128, Co(l, !1), t = d.updateQueue, r.updateQueue = t, Ba(r, t), r.subtreeFlags = 0, t = a, a = r.child; a !== null;) yf(a, t), a = a.sibling;
                    return Ce(ln, ln.current & 1 | 2), ue && or(r, l.treeForkCount), r.child;
                  }
                  t = t.sibling;
                }
                l.tail !== null && ze() > ml && (r.flags |= 128, c = !0, Co(l, !1), r.lanes = 4194304);
              }
            } else {
              if (!c) if (t = ko(d), t !== null) {
                if (r.flags |= 128, c = !0, t = t.updateQueue, r.updateQueue = t, Ba(r, t), Co(l, !0), l.tail === null && l.tailMode === "hidden" && !d.alternate && !ue) return we(r), null;
              } else 2 * ze() - l.renderingStartTime > ml && a !== 536870912 && (r.flags |= 128, c = !0, Co(l, !1), r.lanes = 4194304);
              l.isBackwards ? (d.sibling = r.child, r.child = d) : (t = l.last, t !== null ? t.sibling = d : r.child = d, l.last = d);
            }
            return l.tail !== null ? (t = l.tail, l.rendering = t, l.tail = t.sibling, l.renderingStartTime = ze(), t.sibling = null, a = ln.current, Ce(ln, c ? a & 1 | 2 : a & 1), ue && or(r, l.treeForkCount), t) : (we(r), null);
          case 22:
          case 23:
            return ht(r), bo(), l = r.memoizedState !== null, t !== null ? t.memoizedState !== null !== l && (r.flags |= 8192) : l && (r.flags |= 8192), l ? (a & 536870912) !== 0 && (r.flags & 128) === 0 && (we(r), r.subtreeFlags & 6 && (r.flags |= 8192)) : we(r), a = r.updateQueue, a !== null && Ba(r, a.retryQueue), a = null, t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool), l = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (l = r.memoizedState.cachePool.pool), l !== a && (r.flags |= 2048), t !== null && D(ha), null;
          case 24:
            return a = null, t !== null && (a = t.memoizedState.cache), r.memoizedState.cache !== a && (r.flags |= 2048), En(qe), we(r), null;
          case 25:
            return null;
          case 30:
            return null;
        }
        throw Error(F(156, r.tag));
      }
      function gr(t, r) {
        switch (gu(r), r.tag) {
          case 1:
            return t = r.flags, t & 65536 ? (r.flags = t & -65537 | 128, r) : null;
          case 3:
            return En(qe), Xo(), t = r.flags, (t & 65536) !== 0 && (t & 128) === 0 ? (r.flags = t & -65537 | 128, r) : null;
          case 26:
          case 27:
          case 5:
            return jl(r), null;
          case 31:
            if (r.memoizedState !== null) {
              if (ht(r), r.alternate === null) throw Error(F(340));
              _a();
            }
            return t = r.flags, t & 65536 ? (r.flags = t & -65537 | 128, r) : null;
          case 13:
            if (ht(r), t = r.memoizedState, t !== null && t.dehydrated !== null) {
              if (r.alternate === null) throw Error(F(340));
              _a();
            }
            return t = r.flags, t & 65536 ? (r.flags = t & -65537 | 128, r) : null;
          case 19:
            return D(ln), null;
          case 4:
            return Xo(), null;
          case 10:
            return En(r.type), null;
          case 22:
          case 23:
            return ht(r), bo(), t !== null && D(ha), t = r.flags, t & 65536 ? (r.flags = t & -65537 | 128, r) : null;
          case 24:
            return En(qe), null;
          case 25:
            return null;
          default:
            return null;
        }
      }
      function $u(t, r) {
        switch (gu(r), r.tag) {
          case 3:
            En(qe), Xo();
            break;
          case 26:
          case 27:
          case 5:
            jl(r);
            break;
          case 4:
            Xo();
            break;
          case 31:
            r.memoizedState !== null && ht(r);
            break;
          case 13:
            ht(r);
            break;
          case 19:
            D(ln);
            break;
          case 10:
            En(r.type);
            break;
          case 22:
          case 23:
            ht(r), bo(), t !== null && D(ha);
            break;
          case 24:
            En(qe);
        }
      }
      function Br(t, r) {
        try {
          var a = r.updateQueue,
            l = a !== null ? a.lastEffect : null;
          if (l !== null) {
            var c = l.next;
            a = c;
            do {
              if ((a.tag & t) === t) {
                l = void 0;
                var d = a.create,
                  h = a.inst;
                l = d(), h.destroy = l;
              }
              a = a.next;
            } while (a !== c);
          }
        } catch (y) {
          ve(r, r.return, y);
        }
      }
      function Or(t, r, a) {
        try {
          var l = r.updateQueue,
            c = l !== null ? l.lastEffect : null;
          if (c !== null) {
            var d = c.next;
            l = d;
            do {
              if ((l.tag & t) === t) {
                var h = l.inst,
                  y = h.destroy;
                if (y !== void 0) {
                  h.destroy = void 0, c = r;
                  var R = a,
                    L = y;
                  try {
                    L();
                  } catch (j) {
                    ve(c, R, j);
                  }
                }
              }
              l = l.next;
            } while (l !== d);
          }
        } catch (j) {
          ve(r, r.return, j);
        }
      }
      function Qi(t) {
        var r = t.updateQueue;
        if (r !== null) {
          var a = t.stateNode;
          try {
            Fp(r, a);
          } catch (l) {
            ve(t, t.return, l);
          }
        }
      }
      function Vu(t, r, a) {
        a.props = Wr(t.type, t.memoizedProps), a.state = t.memoizedState;
        try {
          a.componentWillUnmount();
        } catch (l) {
          ve(t, r, l);
        }
      }
      function ta(t, r) {
        try {
          var a = t.ref;
          if (a !== null) {
            switch (t.tag) {
              case 26:
              case 27:
              case 5:
                var l = Ts(t.stateNode);
                break;
              case 30:
                l = t.stateNode;
                break;
              default:
                l = t.stateNode;
            }
            typeof a == "function" ? t.refCleanup = a(l) : a.current = l;
          }
        } catch (c) {
          ve(t, r, c);
        }
      }
      function yr(t, r) {
        var a = t.ref,
          l = t.refCleanup;
        if (a !== null) if (typeof l == "function") try {
          l();
        } catch (c) {
          ve(t, r, c);
        } finally {
          t.refCleanup = null, t = t.alternate, t != null && (t.refCleanup = null);
        } else if (typeof a == "function") try {
          a(null);
        } catch (c) {
          ve(t, r, c);
        } else a.current = null;
      }
      function nf(t) {
        var r = t.type,
          a = t.memoizedProps,
          l = t.stateNode;
        try {
          dh(l, r, a, t);
        } catch (c) {
          ve(t, t.return, c);
        }
      }
      function qu(t, r, a) {
        try {
          vc(t.stateNode, t.type, a, r, t);
        } catch (l) {
          ve(t, t.return, l);
        }
      }
      function tf(t) {
        return t.tag === 5 || t.tag === 3 || (Gt ? t.tag === 26 : !1) || (dn ? t.tag === 27 && Xa(t.type) : !1) || t.tag === 4;
      }
      function Gu(t) {
        e: for (;;) {
          for (; t.sibling === null;) {
            if (t.return === null || tf(t.return)) return null;
            t = t.return;
          }
          for (t.sibling.return = t.return, t = t.sibling; t.tag !== 5 && t.tag !== 6 && t.tag !== 18;) {
            if (dn && t.tag === 27 && Xa(t.type) || t.flags & 2 || t.child === null || t.tag === 4) continue e;
            t.child.return = t, t = t.child;
          }
          if (!(t.flags & 2)) return t.stateNode;
        }
      }
      function fs(t, r, a) {
        var l = t.tag;
        if (l === 5 || l === 6) t = t.stateNode, r ? ph(a, t, r) : ch(a, t);else if (l !== 4 && (dn && l === 27 && Xa(t.type) && (a = t.stateNode, r = null), t = t.child, t !== null)) for (fs(t, r, a), t = t.sibling; t !== null;) fs(t, r, a), t = t.sibling;
      }
      function $i(t, r, a) {
        var l = t.tag;
        if (l === 5 || l === 6) t = t.stateNode, r ? fh(a, t, r) : uh(a, t);else if (l !== 4 && (dn && l === 27 && Xa(t.type) && (a = t.stateNode), t = t.child, t !== null)) for ($i(t, r, a), t = t.sibling; t !== null;) $i(t, r, a), t = t.sibling;
      }
      function Ju(t, r, a) {
        t = t.containerInfo;
        try {
          bh(t, a);
        } catch (l) {
          ve(r, r.return, l);
        }
      }
      function rf(t) {
        var r = t.stateNode,
          a = t.memoizedProps;
        try {
          Rc(t.type, a, r, t);
        } catch (l) {
          ve(t, t.return, l);
        }
      }
      function Wp(t, r) {
        for (Am(t.containerInfo), Pn = r; Pn !== null;) if (t = Pn, r = t.child, (t.subtreeFlags & 1028) !== 0 && r !== null) r.return = t, Pn = r;else for (; Pn !== null;) {
          t = Pn;
          var a = t.alternate;
          switch (r = t.flags, t.tag) {
            case 0:
              if ((r & 4) !== 0 && (r = t.updateQueue, r = r !== null ? r.events : null, r !== null)) for (var l = 0; l < r.length; l++) {
                var c = r[l];
                c.ref.impl = c.nextImpl;
              }
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((r & 1024) !== 0 && a !== null) {
                r = void 0, l = t, c = a.memoizedProps, a = a.memoizedState;
                var d = l.stateNode;
                try {
                  var h = Wr(l.type, c);
                  r = d.getSnapshotBeforeUpdate(h, a), d.__reactInternalSnapshotBeforeUpdate = r;
                } catch (y) {
                  ve(l, l.return, y);
                }
              }
              break;
            case 3:
              (r & 1024) !== 0 && $n && Nt(t.stateNode.containerInfo);
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((r & 1024) !== 0) throw Error(F(163));
          }
          if (r = t.sibling, r !== null) {
            r.return = t.return, Pn = r;
            break;
          }
          Pn = t.return;
        }
      }
      function of(t, r, a) {
        var l = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 15:
            $t(t, a), l & 4 && Br(5, a);
            break;
          case 1:
            if ($t(t, a), l & 4) if (t = a.stateNode, r === null) try {
              t.componentDidMount();
            } catch (h) {
              ve(a, a.return, h);
            } else {
              var c = Wr(a.type, r.memoizedProps);
              r = r.memoizedState;
              try {
                t.componentDidUpdate(c, r, t.__reactInternalSnapshotBeforeUpdate);
              } catch (h) {
                ve(a, a.return, h);
              }
            }
            l & 64 && Qi(a), l & 512 && ta(a, a.return);
            break;
          case 3:
            if ($t(t, a), l & 64 && (l = a.updateQueue, l !== null)) {
              if (t = null, a.child !== null) switch (a.child.tag) {
                case 27:
                case 5:
                  t = Ts(a.child.stateNode);
                  break;
                case 1:
                  t = a.child.stateNode;
              }
              try {
                Fp(l, t);
              } catch (h) {
                ve(a, a.return, h);
              }
            }
            break;
          case 27:
            dn && r === null && l & 4 && rf(a);
          case 26:
          case 5:
            if ($t(t, a), r === null) {
              if (l & 4) nf(a);else if (l & 64) {
                t = a.type, r = a.memoizedProps, c = a.stateNode;
                try {
                  _h(c, t, r, a);
                } catch (h) {
                  ve(a, a.return, h);
                }
              }
            }
            l & 512 && ta(a, a.return);
            break;
          case 12:
            $t(t, a);
            break;
          case 31:
            $t(t, a), l & 4 && af(t, a);
            break;
          case 13:
            $t(t, a), l & 4 && Yu(t, a), l & 64 && (l = a.memoizedState, l !== null && (l = l.dehydrated, l !== null && (a = sc.bind(null, a), Xi(l, a))));
            break;
          case 22:
            if (l = a.memoizedState !== null || eo, !l) {
              r = r !== null && r.memoizedState !== null || sn, c = eo;
              var d = sn;
              eo = l, (sn = r) && !d ? br(t, a, (a.subtreeFlags & 8772) !== 0) : $t(t, a), eo = c, sn = d;
            }
            break;
          case 30:
            break;
          default:
            $t(t, a);
        }
      }
      function Up(t) {
        var r = t.alternate;
        r !== null && (t.alternate = null, Up(r)), t.child = null, t.deletions = null, t.sibling = null, t.tag === 5 && (r = t.stateNode, r !== null && th(r)), t.stateNode = null, t.return = null, t.dependencies = null, t.memoizedProps = null, t.memoizedState = null, t.pendingProps = null, t.stateNode = null, t.updateQueue = null;
      }
      function Qt(t, r, a) {
        for (a = a.child; a !== null;) Zu(t, r, a), a = a.sibling;
      }
      function Zu(t, r, a) {
        if (on && typeof on.onCommitFiberUnmount == "function") try {
          on.onCommitFiberUnmount(ei, a);
        } catch {}
        switch (a.tag) {
          case 26:
            if (Gt) {
              sn || yr(a, r), Qt(t, r, a), a.memoizedState ? Hh(a.memoizedState) : a.stateNode && Wf(a.stateNode);
              break;
            }
          case 27:
            if (dn) {
              sn || yr(a, r);
              var l = mn,
                c = Pt;
              Xa(a.type) && (mn = a.stateNode, Pt = !1), Qt(t, r, a), fa(a.stateNode), mn = l, Pt = c;
              break;
            }
          case 5:
            sn || yr(a, r);
          case 6:
            if ($n) {
              if (l = mn, c = Pt, mn = null, Qt(t, r, a), mn = l, Pt = c, mn !== null) if (Pt) try {
                If(mn, a.stateNode);
              } catch (d) {
                ve(a, r, d);
              } else try {
                Ef(mn, a.stateNode);
              } catch (d) {
                ve(a, r, d);
              }
            } else Qt(t, r, a);
            break;
          case 18:
            $n && mn !== null && (Pt ? Af(mn, a.stateNode) : Se(mn, a.stateNode));
            break;
          case 4:
            $n ? (l = mn, c = Pt, mn = a.stateNode.containerInfo, Pt = !0, Qt(t, r, a), mn = l, Pt = c) : (Sr && Ju(a.stateNode, a, We()), Qt(t, r, a));
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            Or(2, a, r), sn || Or(4, a, r), Qt(t, r, a);
            break;
          case 1:
            sn || (yr(a, r), l = a.stateNode, typeof l.componentWillUnmount == "function" && Vu(a, r, l)), Qt(t, r, a);
            break;
          case 21:
            Qt(t, r, a);
            break;
          case 22:
            sn = (l = sn) || a.memoizedState !== null, Qt(t, r, a), sn = l;
            break;
          default:
            Qt(t, r, a);
        }
      }
      function af(t, r) {
        if (Hn && r.memoizedState === null && (t = r.alternate, t !== null && (t = t.memoizedState, t !== null))) {
          t = t.dehydrated;
          try {
            Rh(t);
          } catch (a) {
            ve(r, r.return, a);
          }
        }
      }
      function Yu(t, r) {
        if (Hn && r.memoizedState === null && (t = r.alternate, t !== null && (t = t.memoizedState, t !== null && (t = t.dehydrated, t !== null)))) try {
          el(t);
        } catch (a) {
          ve(r, r.return, a);
        }
      }
      function Bp(t) {
        switch (t.tag) {
          case 31:
          case 13:
          case 19:
            var r = t.stateNode;
            return r === null && (r = t.stateNode = new $c()), r;
          case 22:
            return t = t.stateNode, r = t._retryCache, r === null && (r = t._retryCache = new $c()), r;
          default:
            throw Error(F(435, t.tag));
        }
      }
      function ps(t, r) {
        var a = Bp(t);
        r.forEach(function (l) {
          if (!a.has(l)) {
            a.add(l);
            var c = Zp.bind(null, t, l);
            l.then(c, c);
          }
        });
      }
      function tn(t, r) {
        var a = r.deletions;
        if (a !== null) for (var l = 0; l < a.length; l++) {
          var c = a[l],
            d = t,
            h = r;
          if ($n) {
            var y = h;
            e: for (; y !== null;) {
              switch (y.tag) {
                case 27:
                  if (dn) {
                    if (Xa(y.type)) {
                      mn = y.stateNode, Pt = !1;
                      break e;
                    }
                    break;
                  }
                case 5:
                  mn = y.stateNode, Pt = !1;
                  break e;
                case 3:
                case 4:
                  mn = y.stateNode.containerInfo, Pt = !0;
                  break e;
              }
              y = y.return;
            }
            if (mn === null) throw Error(F(160));
            Zu(d, h, c), mn = null, Pt = !1;
          } else Zu(d, h, c);
          d = c.alternate, d !== null && (d.return = null), c.return = null;
        }
        if (r.subtreeFlags & 13886) for (r = r.child; r !== null;) hs(r, t), r = r.sibling;
      }
      function hs(t, r) {
        var a = t.alternate,
          l = t.flags;
        switch (t.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            tn(r, t), Mn(t), l & 4 && (Or(3, t, t.return), Br(3, t), Or(5, t, t.return));
            break;
          case 1:
            tn(r, t), Mn(t), l & 512 && (sn || a === null || yr(a, a.return)), l & 64 && eo && (t = t.updateQueue, t !== null && (l = t.callbacks, l !== null && (a = t.shared.hiddenCallbacks, t.shared.hiddenCallbacks = a === null ? l : a.concat(l))));
            break;
          case 26:
            if (Gt) {
              var c = Cr;
              if (tn(r, t), Mn(t), l & 512 && (sn || a === null || yr(a, a.return)), l & 4) {
                l = a !== null ? a.memoizedState : null;
                var d = t.memoizedState;
                a === null ? d === null ? t.stateNode === null ? t.stateNode = Ya(c, t.type, t.memoizedProps, t) : Cc(c, t.type, t.stateNode) : t.stateNode = Fh(c, d, t.memoizedProps) : l !== d ? (l === null ? a.stateNode !== null && Wf(a.stateNode) : Hh(l), d === null ? Cc(c, t.type, t.stateNode) : Fh(c, d, t.memoizedProps)) : d === null && t.stateNode !== null && qu(t, t.memoizedProps, a.memoizedProps);
              }
              break;
            }
          case 27:
            if (dn) {
              tn(r, t), Mn(t), l & 512 && (sn || a === null || yr(a, a.return)), a !== null && l & 4 && qu(t, t.memoizedProps, a.memoizedProps);
              break;
            }
          case 5:
            if (tn(r, t), Mn(t), l & 512 && (sn || a === null || yr(a, a.return)), $n) {
              if (t.flags & 32) {
                c = t.stateNode;
                try {
                  Sc(c);
                } catch (A) {
                  ve(t, t.return, A);
                }
              }
              l & 4 && t.stateNode != null && (c = t.memoizedProps, qu(t, c, a !== null ? a.memoizedProps : c)), l & 1024 && (Ms = !0);
            } else Sr && t.alternate !== null && (t.alternate.stateNode = t.stateNode);
            break;
          case 6:
            if (tn(r, t), Mn(t), l & 4 && $n) {
              if (t.stateNode === null) throw Error(F(162));
              l = t.memoizedProps, a = a !== null ? a.memoizedProps : l, c = t.stateNode;
              try {
                Is(c, a, l);
              } catch (A) {
                ve(t, t.return, A);
              }
            }
            break;
          case 3:
            if (Gt ? (jh(), c = Cr, Cr = zc(r.containerInfo), tn(r, t), Cr = c) : tn(r, t), Mn(t), l & 4) {
              if ($n && Hn && a !== null && a.memoizedState.isDehydrated) try {
                Mm(r.containerInfo);
              } catch (A) {
                ve(t, t.return, A);
              }
              if (Sr) {
                l = r.containerInfo, a = r.pendingChildren;
                try {
                  bh(l, a);
                } catch (A) {
                  ve(t, t.return, A);
                }
              }
            }
            Ms && (Ms = !1, Op(t));
            break;
          case 4:
            Gt ? (a = Cr, Cr = zc(t.stateNode.containerInfo), tn(r, t), Mn(t), Cr = a) : (tn(r, t), Mn(t)), l & 4 && Sr && Ju(t.stateNode, t, t.stateNode.pendingChildren);
            break;
          case 12:
            tn(r, t), Mn(t);
            break;
          case 31:
            tn(r, t), Mn(t), l & 4 && (l = t.updateQueue, l !== null && (t.updateQueue = null, ps(t, l)));
            break;
          case 13:
            tn(r, t), Mn(t), t.child.flags & 8192 && t.memoizedState !== null != (a !== null && a.memoizedState !== null) && (Vs = ze()), l & 4 && (l = t.updateQueue, l !== null && (t.updateQueue = null, ps(t, l)));
            break;
          case 22:
            c = t.memoizedState !== null;
            var h = a !== null && a.memoizedState !== null,
              y = eo,
              R = sn;
            if (eo = y || c, sn = R || h, tn(r, t), sn = R, eo = y, Mn(t), l & 8192 && (r = t.stateNode, r._visibility = c ? r._visibility & -2 : r._visibility | 1, c && (a === null || h || eo || sn || Vt(t)), $n)) {
              e: if (a = null, $n) for (r = t;;) {
                if (r.tag === 5 || Gt && r.tag === 26) {
                  if (a === null) {
                    h = a = r;
                    try {
                      d = h.stateNode, c ? hh(d) : Wm(h.stateNode, h.memoizedProps);
                    } catch (A) {
                      ve(h, h.return, A);
                    }
                  }
                } else if (r.tag === 6) {
                  if (a === null) {
                    h = r;
                    try {
                      var L = h.stateNode;
                      c ? kc(L) : mh(L, h.memoizedProps);
                    } catch (A) {
                      ve(h, h.return, A);
                    }
                  }
                } else if (r.tag === 18) {
                  if (a === null) {
                    h = r;
                    try {
                      var j = h.stateNode;
                      c ? Qm(j) : Lh(h.stateNode);
                    } catch (A) {
                      ve(h, h.return, A);
                    }
                  }
                } else if ((r.tag !== 22 && r.tag !== 23 || r.memoizedState === null || r === t) && r.child !== null) {
                  r.child.return = r, r = r.child;
                  continue;
                }
                if (r === t) break e;
                for (; r.sibling === null;) {
                  if (r.return === null || r.return === t) break e;
                  a === r && (a = null), r = r.return;
                }
                a === r && (a = null), r.sibling.return = r.return, r = r.sibling;
              }
            }
            l & 4 && (l = t.updateQueue, l !== null && (a = l.retryQueue, a !== null && (l.retryQueue = null, ps(t, a))));
            break;
          case 19:
            tn(r, t), Mn(t), l & 4 && (l = t.updateQueue, l !== null && (t.updateQueue = null, ps(t, l)));
            break;
          case 30:
            break;
          case 21:
            break;
          default:
            tn(r, t), Mn(t);
        }
      }
      function Mn(t) {
        var r = t.flags;
        if (r & 2) {
          try {
            for (var a, l = t.return; l !== null;) {
              if (tf(l)) {
                a = l;
                break;
              }
              l = l.return;
            }
            if ($n) {
              if (a == null) throw Error(F(160));
              switch (a.tag) {
                case 27:
                  if (dn) {
                    var c = a.stateNode,
                      d = Gu(t);
                    $i(t, d, c);
                    break;
                  }
                case 5:
                  var h = a.stateNode;
                  a.flags & 32 && (Sc(h), a.flags &= -33);
                  var y = Gu(t);
                  $i(t, y, h);
                  break;
                case 3:
                case 4:
                  var R = a.stateNode.containerInfo,
                    L = Gu(t);
                  fs(t, L, R);
                  break;
                default:
                  throw Error(F(161));
              }
            }
          } catch (j) {
            ve(t, t.return, j);
          }
          t.flags &= -3;
        }
        r & 4096 && (t.flags &= -4097);
      }
      function Op(t) {
        if (t.subtreeFlags & 1024) for (t = t.child; t !== null;) {
          var r = t;
          Op(r), r.tag === 5 && r.flags & 1024 && qa(r.stateNode), t = t.sibling;
        }
      }
      function $t(t, r) {
        if (r.subtreeFlags & 8772) for (r = r.child; r !== null;) of(t, r.alternate, r), r = r.sibling;
      }
      function Vt(t) {
        for (t = t.child; t !== null;) {
          var r = t;
          switch (r.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              Or(4, r, r.return), Vt(r);
              break;
            case 1:
              yr(r, r.return);
              var a = r.stateNode;
              typeof a.componentWillUnmount == "function" && Vu(r, r.return, a), Vt(r);
              break;
            case 27:
              dn && fa(r.stateNode);
            case 26:
            case 5:
              yr(r, r.return), Vt(r);
              break;
            case 22:
              r.memoizedState === null && Vt(r);
              break;
            case 30:
              Vt(r);
              break;
            default:
              Vt(r);
          }
          t = t.sibling;
        }
      }
      function br(t, r, a) {
        for (a = a && (r.subtreeFlags & 8772) !== 0, r = r.child; r !== null;) {
          var l = r.alternate,
            c = t,
            d = r,
            h = d.flags;
          switch (d.tag) {
            case 0:
            case 11:
            case 15:
              br(c, d, a), Br(4, d);
              break;
            case 1:
              if (br(c, d, a), l = d, c = l.stateNode, typeof c.componentDidMount == "function") try {
                c.componentDidMount();
              } catch (L) {
                ve(l, l.return, L);
              }
              if (l = d, c = l.updateQueue, c !== null) {
                var y = l.stateNode;
                try {
                  var R = c.shared.hiddenCallbacks;
                  if (R !== null) for (c.shared.hiddenCallbacks = null, c = 0; c < R.length; c++) Dd(R[c], y);
                } catch (L) {
                  ve(l, l.return, L);
                }
              }
              a && h & 64 && Qi(d), ta(d, d.return);
              break;
            case 27:
              dn && rf(d);
            case 26:
            case 5:
              br(c, d, a), a && l === null && h & 4 && nf(d), ta(d, d.return);
              break;
            case 12:
              br(c, d, a);
              break;
            case 31:
              br(c, d, a), a && h & 4 && af(c, d);
              break;
            case 13:
              br(c, d, a), a && h & 4 && Yu(c, d);
              break;
            case 22:
              d.memoizedState === null && br(c, d, a), ta(d, d.return);
              break;
            case 30:
              break;
            default:
              br(c, d, a);
          }
          r = r.sibling;
        }
      }
      function To(t, r) {
        var a = null;
        t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (a = t.memoizedState.cachePool.pool), t = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (t = r.memoizedState.cachePool.pool), t !== a && (t != null && t.refCount++, a != null && Ra(a));
      }
      function Qn(t, r) {
        t = null, r.alternate !== null && (t = r.alternate.memoizedState.cache), r = r.memoizedState.cache, r !== t && (r.refCount++, t != null && Ra(t));
      }
      function yt(t, r, a, l) {
        if (r.subtreeFlags & 10256) for (r = r.child; r !== null;) Mp(t, r, a, l), r = r.sibling;
      }
      function Mp(t, r, a, l) {
        var c = r.flags;
        switch (r.tag) {
          case 0:
          case 11:
          case 15:
            yt(t, r, a, l), c & 2048 && Br(9, r);
            break;
          case 1:
            yt(t, r, a, l);
            break;
          case 3:
            yt(t, r, a, l), c & 2048 && (t = null, r.alternate !== null && (t = r.alternate.memoizedState.cache), r = r.memoizedState.cache, r !== t && (r.refCount++, t != null && Ra(t)));
            break;
          case 12:
            if (c & 2048) {
              yt(t, r, a, l), t = r.stateNode;
              try {
                var d = r.memoizedProps,
                  h = d.id,
                  y = d.onPostCommit;
                typeof y == "function" && y(h, r.alternate === null ? "mount" : "update", t.passiveEffectDuration, -0);
              } catch (R) {
                ve(r, r.return, R);
              }
            } else yt(t, r, a, l);
            break;
          case 31:
            yt(t, r, a, l);
            break;
          case 13:
            yt(t, r, a, l);
            break;
          case 23:
            break;
          case 22:
            d = r.stateNode, h = r.alternate, r.memoizedState !== null ? d._visibility & 2 ? yt(t, r, a, l) : oa(t, r) : d._visibility & 2 ? yt(t, r, a, l) : (d._visibility |= 2, ra(t, r, a, l, (r.subtreeFlags & 10256) !== 0 || !1)), c & 2048 && To(h, r);
            break;
          case 24:
            yt(t, r, a, l), c & 2048 && Qn(r.alternate, r);
            break;
          default:
            yt(t, r, a, l);
        }
      }
      function ra(t, r, a, l, c) {
        for (c = c && ((r.subtreeFlags & 10256) !== 0 || !1), r = r.child; r !== null;) {
          var d = t,
            h = r,
            y = a,
            R = l,
            L = h.flags;
          switch (h.tag) {
            case 0:
            case 11:
            case 15:
              ra(d, h, y, R, c), Br(8, h);
              break;
            case 23:
              break;
            case 22:
              var j = h.stateNode;
              h.memoizedState !== null ? j._visibility & 2 ? ra(d, h, y, R, c) : oa(d, h) : (j._visibility |= 2, ra(d, h, y, R, c)), c && L & 2048 && To(h.alternate, h);
              break;
            case 24:
              ra(d, h, y, R, c), c && L & 2048 && Qn(h.alternate, h);
              break;
            default:
              ra(d, h, y, R, c);
          }
          r = r.sibling;
        }
      }
      function oa(t, r) {
        if (r.subtreeFlags & 10256) for (r = r.child; r !== null;) {
          var a = t,
            l = r,
            c = l.flags;
          switch (l.tag) {
            case 22:
              oa(a, l), c & 2048 && To(l.alternate, l);
              break;
            case 24:
              oa(a, l), c & 2048 && Qn(l.alternate, l);
              break;
            default:
              oa(a, l);
          }
          r = r.sibling;
        }
      }
      function _o(t, r, a) {
        if (t.subtreeFlags & ga) for (t = t.child; t !== null;) lf(t, r, a), t = t.sibling;
      }
      function lf(t, r, a) {
        switch (t.tag) {
          case 26:
            if (_o(t, r, a), t.flags & ga) if (t.memoizedState !== null) Fo(a, Cr, t.memoizedState, t.memoizedProps);else {
              var l = t.stateNode,
                c = t.type;
              t = t.memoizedProps, ((r & 335544128) === r || Yi(c, t)) && Vn(a, l, c, t);
            }
            break;
          case 5:
            _o(t, r, a), t.flags & ga && (l = t.stateNode, c = t.type, t = t.memoizedProps, ((r & 335544128) === r || Yi(c, t)) && Vn(a, l, c, t));
            break;
          case 3:
          case 4:
            Gt ? (l = Cr, Cr = zc(t.stateNode.containerInfo), _o(t, r, a), Cr = l) : _o(t, r, a);
            break;
          case 22:
            t.memoizedState === null && (l = t.alternate, l !== null && l.memoizedState !== null ? (l = ga, ga = 16777216, _o(t, r, a), ga = l) : _o(t, r, a));
            break;
          default:
            _o(t, r, a);
        }
      }
      function Xu(t) {
        var r = t.alternate;
        if (r !== null && (t = r.child, t !== null)) {
          r.child = null;
          do r = t.sibling, t.sibling = null, t = r; while (t !== null);
        }
      }
      function aa(t) {
        var r = t.deletions;
        if ((t.flags & 16) !== 0) {
          if (r !== null) for (var a = 0; a < r.length; a++) {
            var l = r[a];
            Pn = l, ec(l, t);
          }
          Xu(t);
        }
        if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) Ku(t), t = t.sibling;
      }
      function Ku(t) {
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            aa(t), t.flags & 2048 && Or(9, t, t.return);
            break;
          case 3:
            aa(t);
            break;
          case 12:
            aa(t);
            break;
          case 22:
            var r = t.stateNode;
            t.memoizedState !== null && r._visibility & 2 && (t.return === null || t.return.tag !== 13) ? (r._visibility &= -3, Ma(t)) : aa(t);
            break;
          default:
            aa(t);
        }
      }
      function Ma(t) {
        var r = t.deletions;
        if ((t.flags & 16) !== 0) {
          if (r !== null) for (var a = 0; a < r.length; a++) {
            var l = r[a];
            Pn = l, ec(l, t);
          }
          Xu(t);
        }
        for (t = t.child; t !== null;) {
          switch (r = t, r.tag) {
            case 0:
            case 11:
            case 15:
              Or(8, r, r.return), Ma(r);
              break;
            case 22:
              a = r.stateNode, a._visibility & 2 && (a._visibility &= -3, Ma(r));
              break;
            default:
              Ma(r);
          }
          t = t.sibling;
        }
      }
      function ec(t, r) {
        for (; Pn !== null;) {
          var a = Pn;
          switch (a.tag) {
            case 0:
            case 11:
            case 15:
              Or(8, a, r);
              break;
            case 23:
            case 22:
              if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
                var l = a.memoizedState.cachePool.pool;
                l != null && l.refCount++;
              }
              break;
            case 24:
              Ra(a.memoizedState.cache);
          }
          if (l = a.child, l !== null) l.return = a, Pn = l;else e: for (a = t; Pn !== null;) {
            l = Pn;
            var c = l.sibling,
              d = l.return;
            if (Up(l), l === a) {
              Pn = null;
              break e;
            }
            if (c !== null) {
              c.return = d, Pn = c;
              break e;
            }
            Pn = d;
          }
        }
      }
      function Vi(t) {
        var r = nh(t);
        if (r != null) {
          if (typeof r.memoizedProps["data-testname"] != "string") throw Error(F(364));
          return r;
        }
        if (t = Rf(t), t === null) throw Error(F(362));
        return t.stateNode.current;
      }
      function ms(t, r) {
        var a = t.tag;
        switch (r.$$typeof) {
          case Vc:
            if (t.type === r.value) return !0;
            break;
          case qc:
            e: {
              for (r = r.value, t = [t, 0], a = 0; a < t.length;) {
                var l = t[a++],
                  c = l.tag,
                  d = t[a++],
                  h = r[d];
                if (c !== 5 && c !== 26 && c !== 27 || !Jr(l)) {
                  for (; h != null && ms(l, h);) d++, h = r[d];
                  if (d === r.length) {
                    r = !0;
                    break e;
                  } else for (l = l.child; l !== null;) t.push(l, d), l = l.sibling;
                }
              }
              r = !1;
            }
            return r;
          case Gc:
            if ((a === 5 || a === 26 || a === 27) && sh(t.stateNode, r.value)) return !0;
            break;
          case Zc:
            if ((a === 5 || a === 6 || a === 26 || a === 27) && (t = lh(t), t !== null && 0 <= t.indexOf(r.value))) return !0;
            break;
          case Jc:
            if ((a === 5 || a === 26 || a === 27) && (t = t.memoizedProps["data-testname"], typeof t == "string" && t.toLowerCase() === r.value.toLowerCase())) return !0;
            break;
          default:
            throw Error(F(365));
        }
        return !1;
      }
      function nc(t) {
        switch (t.$$typeof) {
          case Vc:
            return "<" + (hu(t.value) || "Unknown") + ">";
          case qc:
            return ":has(" + (nc(t) || "") + ")";
          case Gc:
            return '[role="' + t.value + '"]';
          case Zc:
            return '"' + t.value + '"';
          case Jc:
            return '[data-testname="' + t.value + '"]';
          default:
            throw Error(F(365));
        }
      }
      function sf(t, r) {
        var a = [];
        t = [t, 0];
        for (var l = 0; l < t.length;) {
          var c = t[l++],
            d = c.tag,
            h = t[l++],
            y = r[h];
          if (d !== 5 && d !== 26 && d !== 27 || !Jr(c)) {
            for (; y != null && ms(c, y);) h++, y = r[h];
            if (h === r.length) a.push(c);else for (c = c.child; c !== null;) t.push(c, h), c = c.sibling;
          }
        }
        return a;
      }
      function gs(t, r) {
        if (!Ga) throw Error(F(363));
        t = Vi(t), t = sf(t, r), r = [], t = Array.from(t);
        for (var a = 0; a < t.length;) {
          var l = t[a++],
            c = l.tag;
          if (c === 5 || c === 26 || c === 27) Jr(l) || r.push(l.stateNode);else for (l = l.child; l !== null;) t.push(l), l = l.sibling;
        }
        return r;
      }
      function bt() {
        return (ce & 2) !== 0 && he !== 0 ? he & -he : M.T !== null ? ku() : kr();
      }
      function ys() {
        if (At === 0) if ((he & 536870912) === 0 || ue) {
          var t = js;
          js <<= 1, (js & 3932160) === 0 && (js = 262144), At = t;
        } else At = 536870912;
        return t = Ft.current, t !== null && (t.flags |= 32), At;
      }
      function nt(t, r, a) {
        (t === Ne && (_e === 2 || _e === 9) || t.cancelPendingCommit !== null) && (la(t, 0), Ro(t, he, At, !1)), xi(t, a), ((ce & 2) === 0 || t !== Ne) && (t === Ne && ((ce & 2) === 0 && (ii |= a), Xe === 4 && Ro(t, he, At, !1)), ir(t));
      }
      function uf(t, r, a) {
        if ((ce & 6) !== 0) throw Error(F(327));
        var l = !a && (r & 127) === 0 && (r & t.expiredLanes) === 0 || Pi(t, r),
          c = l ? Gp(t, r) : Ji(t, r, !0),
          d = l;
        do {
          if (c === 0) {
            ai && !l && Ro(t, r, 0, !1);
            break;
          } else {
            if (a = t.current.alternate, d && !Qp(a)) {
              c = Ji(t, r, !1), d = !1;
              continue;
            }
            if (c === 2) {
              if (d = r, t.errorRecoveryDisabledLanes & d) var h = 0;else h = t.pendingLanes & -536870913, h = h !== 0 ? h : h & 536870912 ? 536870912 : 0;
              if (h !== 0) {
                r = h;
                e: {
                  var y = t;
                  c = $s;
                  var R = Hn && y.current.memoizedState.isDehydrated;
                  if (R && (la(y, h).flags |= 256), h = Ji(y, h, !1), h !== 2) {
                    if (Gf && !R) {
                      y.errorRecoveryDisabledLanes |= d, ii |= d, c = 4;
                      break e;
                    }
                    d = xt, xt = c, d !== null && (xt === null ? xt = d : xt.push.apply(xt, d));
                  }
                  c = h;
                }
                if (d = !1, c !== 2) continue;
              }
            }
            if (c === 1) {
              la(t, 0), Ro(t, r, 0, !0);
              break;
            }
            e: {
              switch (l = t, d = c, d) {
                case 0:
                case 1:
                  throw Error(F(345));
                case 4:
                  if ((r & 4194048) !== r) break;
                case 6:
                  Ro(l, r, At, !ya);
                  break e;
                case 2:
                  xt = null;
                  break;
                case 3:
                case 5:
                  break;
                default:
                  throw Error(F(329));
              }
              if ((r & 62914560) === r && (c = Vs + 300 - ze(), 10 < c)) {
                if (Ro(l, r, At, !ya), Lr(l, 0, !0) !== 0) break e;
                no = r, l.timeoutHandle = eh(tc.bind(null, l, a, xt, Xc, Yc, r, At, ii, hl, ya, d, "Throttled", -0, 0), c);
                break e;
              }
              tc(l, a, xt, Xc, Yc, r, At, ii, hl, ya, d, null, -0, 0);
            }
          }
          break;
        } while (!0);
        ir(t);
      }
      function tc(t, r, a, l, c, d, h, y, R, L, j, A, W, V) {
        if (t.timeoutHandle = Lo, A = r.subtreeFlags, A & 8192 || (A & 16785408) === 16785408) {
          A = oh(), lf(r, d, A);
          var Oe = (d & 62914560) === d ? Vs - ze() : (d & 4194048) === d ? Zf - ze() : 0;
          if (Oe = ah(A, Oe), Oe !== null) {
            no = d, t.cancelPendingCommit = Oe(pf.bind(null, t, r, d, a, l, c, h, y, R, j, A, null, W, V)), Ro(t, d, h, !L);
            return;
          }
        }
        pf(t, r, d, a, l, c, h, y, R);
      }
      function Qp(t) {
        for (var r = t;;) {
          var a = r.tag;
          if ((a === 0 || a === 11 || a === 15) && r.flags & 16384 && (a = r.updateQueue, a !== null && (a = a.stores, a !== null))) for (var l = 0; l < a.length; l++) {
            var c = a[l],
              d = c.getSnapshot;
            c = c.value;
            try {
              if (!jn(d(), c)) return !1;
            } catch {
              return !1;
            }
          }
          if (a = r.child, r.subtreeFlags & 16384 && a !== null) a.return = r, r = a;else {
            if (r === t) break;
            for (; r.sibling === null;) {
              if (r.return === null || r.return === t) return !0;
              r = r.return;
            }
            r.sibling.return = r.return, r = r.sibling;
          }
        }
        return !0;
      }
      function Ro(t, r, a, l) {
        r &= ~Jf, r &= ~ii, t.suspendedLanes |= r, t.pingedLanes &= ~r, l && (t.warmLanes |= r), l = t.expirationTimes;
        for (var c = r; 0 < c;) {
          var d = 31 - vt(c),
            h = 1 << d;
          l[d] = -1, c &= ~h;
        }
        a !== 0 && Yo(t, a, r);
      }
      function ia() {
        return (ce & 6) === 0 ? (Ea(0, !1), !1) : !0;
      }
      function bs() {
        if (de !== null) {
          if (_e === 0) var t = de.return;else t = de, Be = at = null, Vl(t), Kt = null, Bs = 0, t = de;
          for (; t !== null;) $u(t.alternate, t), t = t.return;
          de = null;
        }
      }
      function la(t, r) {
        var a = t.timeoutHandle;
        a !== Lo && (t.timeoutHandle = Lo, Tf(a)), a = t.cancelPendingCommit, a !== null && (t.cancelPendingCommit = null, a()), no = 0, bs(), Ne = t, de = a = Qr(t.current, null), he = r, _e = 0, Ht = null, ya = !1, ai = Pi(t, r), Gf = !1, hl = At = Jf = ii = ba = Xe = 0, xt = $s = null, Yc = !1, (r & 8) !== 0 && (r |= r & 32);
        var l = t.entangledLanes;
        if (l !== 0) for (t = t.entanglements, l &= r; 0 < l;) {
          var c = 31 - vt(l),
            d = 1 << c;
          r |= t[c], l &= ~d;
        }
        return Uo = r, Bn(), a;
      }
      function $p(t, r) {
        ne = null, M.H = Os, r === cl || r === jc ? (r = Bl(), _e = 3) : r === Ac ? (r = Bl(), _e = 4) : _e = r === Mc ? 8 : r !== null && typeof r == "object" && typeof r.then == "function" ? 6 : 1, Ht = r, de === null && (Xe = 1, rs(t, ut(r, t.current)));
      }
      function Vp() {
        var t = Ft.current;
        return t === null ? !0 : (he & 4194048) === he ? zr === null : (he & 62914560) === he || (he & 536870912) !== 0 ? t === zr : !1;
      }
      function cf() {
        var t = M.H;
        return M.H = Os, t === null ? Os : t;
      }
      function qi() {
        var t = M.A;
        return M.A = Zm, t;
      }
      function Gi() {
        Xe = 4, ya || (he & 4194048) !== he && Ft.current !== null || (ai = !0), (ba & 134217727) === 0 && (ii & 134217727) === 0 || Ne === null || Ro(Ne, he, At, !1);
      }
      function Ji(t, r, a) {
        var l = ce;
        ce |= 2;
        var c = cf(),
          d = qi();
        (Ne !== t || he !== r) && (Xc = null, la(t, r)), r = !1;
        var h = Xe;
        e: do try {
          if (_e !== 0 && de !== null) {
            var y = de,
              R = Ht;
            switch (_e) {
              case 8:
                bs(), h = 6;
                break e;
              case 3:
              case 2:
              case 9:
              case 6:
                Ft.current === null && (r = !0);
                var L = _e;
                if (_e = 0, Ht = null, Qa(t, y, R, L), a && ai) {
                  h = 0;
                  break e;
                }
                break;
              default:
                L = _e, _e = 0, Ht = null, Qa(t, y, R, L);
            }
          }
          qp(), h = Xe;
          break;
        } catch (j) {
          $p(t, j);
        } while (!0);
        return r && t.shellSuspendCounter++, Be = at = null, ce = l, M.H = c, M.A = d, de === null && (Ne = null, he = 0, Bn()), h;
      }
      function qp() {
        for (; de !== null;) rc(de);
      }
      function Gp(t, r) {
        var a = ce;
        ce |= 2;
        var l = cf(),
          c = qi();
        Ne !== t || he !== r ? (Xc = null, ml = ze() + 500, la(t, r)) : ai = Pi(t, r);
        e: do try {
          if (_e !== 0 && de !== null) {
            r = de;
            var d = Ht;
            n: switch (_e) {
              case 1:
                _e = 0, Ht = null, Qa(t, r, d, 1);
                break;
              case 2:
              case 9:
                if (Hd(d)) {
                  _e = 0, Ht = null, ff(r);
                  break;
                }
                r = function () {
                  _e !== 2 && _e !== 9 || Ne !== t || (_e = 7), ir(t);
                }, d.then(r, r);
                break e;
              case 3:
                _e = 7;
                break e;
              case 4:
                _e = 5;
                break e;
              case 7:
                Hd(d) ? (_e = 0, Ht = null, ff(r)) : (_e = 0, Ht = null, Qa(t, r, d, 7));
                break;
              case 5:
                var h = null;
                switch (de.tag) {
                  case 26:
                    h = de.memoizedState;
                  case 5:
                  case 27:
                    var y = de,
                      R = y.type,
                      L = y.pendingProps;
                    if (h ? Tc(h) : An(y.stateNode, R, L)) {
                      _e = 0, Ht = null;
                      var j = y.sibling;
                      if (j !== null) de = j;else {
                        var A = y.return;
                        A !== null ? (de = A, Mr(A)) : de = null;
                      }
                      break n;
                    }
                }
                _e = 0, Ht = null, Qa(t, r, d, 5);
                break;
              case 6:
                _e = 0, Ht = null, Qa(t, r, d, 6);
                break;
              case 8:
                bs(), Xe = 6;
                break e;
              default:
                throw Error(F(462));
            }
          }
          df();
          break;
        } catch (W) {
          $p(t, W);
        } while (!0);
        return Be = at = null, M.H = l, M.A = c, ce = a, de !== null ? 0 : (Ne = null, he = 0, Bn(), Xe);
      }
      function df() {
        for (; de !== null && !qm();) rc(de);
      }
      function rc(t) {
        var r = Bu(t.alternate, t, Uo);
        t.memoizedProps = t.pendingProps, r === null ? Mr(t) : de = r;
      }
      function ff(t) {
        var r = t,
          a = r.alternate;
        switch (r.tag) {
          case 15:
          case 0:
            r = Xd(a, r, r.pendingProps, r.type, void 0, he);
            break;
          case 11:
            r = Xd(a, r, r.pendingProps, r.type.render, r.ref, he);
            break;
          case 5:
            Vl(r);
          default:
            $u(a, r), r = de = yf(r, Uo), r = Bu(a, r, Uo);
        }
        t.memoizedProps = t.pendingProps, r === null ? Mr(t) : de = r;
      }
      function Qa(t, r, a, l) {
        Be = at = null, Vl(r), Kt = null, Bs = 0;
        var c = r.return;
        try {
          if (On(t, c, r, a, he)) {
            Xe = 1, rs(t, ut(a, t.current)), de = null;
            return;
          }
        } catch (d) {
          if (c !== null) throw de = c, d;
          Xe = 1, rs(t, ut(a, t.current)), de = null;
          return;
        }
        r.flags & 32768 ? (ue || l === 1 ? t = !0 : ai || (he & 536870912) !== 0 ? t = !1 : (ya = t = !0, (l === 2 || l === 9 || l === 3 || l === 6) && (l = Ft.current, l !== null && l.tag === 13 && (l.flags |= 16384))), vs(r, t)) : Mr(r);
      }
      function Mr(t) {
        var r = t;
        do {
          if ((r.flags & 32768) !== 0) {
            vs(r, ya);
            return;
          }
          t = r.return;
          var a = Oa(r.alternate, r, Uo);
          if (a !== null) {
            de = a;
            return;
          }
          if (r = r.sibling, r !== null) {
            de = r;
            return;
          }
          de = r = t;
        } while (r !== null);
        Xe === 0 && (Xe = 5);
      }
      function vs(t, r) {
        do {
          var a = gr(t.alternate, t);
          if (a !== null) {
            a.flags &= 32767, de = a;
            return;
          }
          if (a = t.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !r && (t = t.sibling, t !== null)) {
            de = t;
            return;
          }
          de = t = a;
        } while (t !== null);
        Xe = 6, de = null;
      }
      function pf(t, r, a, l, c, d, h, y, R) {
        t.cancelPendingCommit = null;
        do rn(); while (Re !== 0);
        if ((ce & 6) !== 0) throw Error(F(327));
        if (r !== null) {
          if (r === t.current) throw Error(F(177));
          if (d = r.lanes | r.childLanes, d |= $f, _p(t, a, d, h, y, R), t === Ne && (de = Ne = null, he = 0), Sa = r, Bo = t, no = a, Kc = d, ed = c, $h = l, (r.subtreeFlags & 10256) !== 0 || (r.flags & 10256) !== 0 ? (t.callbackNode = null, t.callbackPriority = 0, Nm(Ao, function () {
            return hf(), null;
          })) : (t.callbackNode = null, t.callbackPriority = 0), l = (r.flags & 13878) !== 0, (r.subtreeFlags & 13878) !== 0 || l) {
            l = M.T, M.T = null, c = qr(), yn(2), h = ce, ce |= 4;
            try {
              Wp(t, r, a);
            } finally {
              ce = h, yn(c), M.T = l;
            }
          }
          Re = 1, oc(), ac(), ic();
        }
      }
      function oc() {
        if (Re === 1) {
          Re = 0;
          var t = Bo,
            r = Sa,
            a = (r.flags & 13878) !== 0;
          if ((r.subtreeFlags & 13878) !== 0 || a) {
            a = M.T, M.T = null;
            var l = qr();
            yn(2);
            var c = ce;
            ce |= 4;
            try {
              hs(r, t), _s(t.containerInfo);
            } finally {
              ce = c, yn(l), M.T = a;
            }
          }
          t.current = r, Re = 2;
        }
      }
      function ac() {
        if (Re === 2) {
          Re = 0;
          var t = Bo,
            r = Sa,
            a = (r.flags & 8772) !== 0;
          if ((r.subtreeFlags & 8772) !== 0 || a) {
            a = M.T, M.T = null;
            var l = qr();
            yn(2);
            var c = ce;
            ce |= 4;
            try {
              of(t, r.alternate, r);
            } finally {
              ce = c, yn(l), M.T = a;
            }
          }
          Re = 3;
        }
      }
      function ic() {
        if (Re === 4 || Re === 3) {
          Re = 0, St();
          var t = Bo,
            r = Sa,
            a = no,
            l = $h;
          (r.subtreeFlags & 10256) !== 0 || (r.flags & 10256) !== 0 ? Re = 5 : (Re = 0, Sa = Bo = null, Jp(t, t.pendingLanes));
          var c = t.pendingLanes;
          if (c === 0 && (va = null), Ze(a), r = r.stateNode, on && typeof on.onCommitFiberRoot == "function") try {
            on.onCommitFiberRoot(ei, r, void 0, (r.current.flags & 128) === 128);
          } catch {}
          if (l !== null) {
            r = M.T, c = qr(), yn(2), M.T = null;
            try {
              for (var d = t.onRecoverableError, h = 0; h < l.length; h++) {
                var y = l[h];
                d(y.value, {
                  componentStack: y.stack
                });
              }
            } finally {
              M.T = r, yn(c);
            }
          }
          (no & 3) !== 0 && rn(), ir(t), c = t.pendingLanes, (a & 261930) !== 0 && (c & 42) !== 0 ? t === nd ? gl++ : (gl = 0, nd = t) : gl = 0, Hn && Ih(), Ea(0, !1);
        }
      }
      function Jp(t, r) {
        (t.pooledCacheLanes &= r) === 0 && (r = t.pooledCache, r != null && (t.pooledCache = null, Ra(r)));
      }
      function rn() {
        return oc(), ac(), ic(), hf();
      }
      function hf() {
        if (Re !== 5) return !1;
        var t = Bo,
          r = Kc;
        Kc = 0;
        var a = Ze(no),
          l = 32 > a ? 32 : a;
        a = M.T;
        var c = qr();
        try {
          yn(l), M.T = null, l = ed, ed = null;
          var d = Bo,
            h = no;
          if (Re = 0, Sa = Bo = null, no = 0, (ce & 6) !== 0) throw Error(F(331));
          var y = ce;
          if (ce |= 4, Ku(d.current), Mp(d, d.current, h, l), ce = y, Ea(0, !1), on && typeof on.onPostCommitFiberRoot == "function") try {
            on.onPostCommitFiberRoot(ei, d);
          } catch {}
          return !0;
        } finally {
          yn(c), M.T = a, Jp(t, r);
        }
      }
      function mf(t, r, a) {
        r = ut(a, r), r = Ui(t.stateNode, r, 2), t = Nr(t, r, 2), t !== null && (xi(t, 2), ir(t));
      }
      function ve(t, r, a) {
        if (t.tag === 3) mf(t, t, a);else for (; r !== null;) {
          if (r.tag === 3) {
            mf(r, t, a);
            break;
          } else if (r.tag === 1) {
            var l = r.stateNode;
            if (typeof r.type.getDerivedStateFromError == "function" || typeof l.componentDidCatch == "function" && (va === null || !va.has(l))) {
              t = ut(a, t), a = os(2), l = Nr(r, a, 2), l !== null && (Hu(a, l, r, t), xi(l, 2), ir(l));
              break;
            }
          }
          r = r.return;
        }
      }
      function lc(t, r, a) {
        var l = t.pingCache;
        if (l === null) {
          l = t.pingCache = new Ym();
          var c = new Set();
          l.set(r, c);
        } else c = l.get(r), c === void 0 && (c = new Set(), l.set(r, c));
        c.has(a) || (Gf = !0, c.add(a), t = Ss.bind(null, t, r, a), r.then(t, t));
      }
      function Ss(t, r, a) {
        var l = t.pingCache;
        l !== null && l.delete(r), t.pingedLanes |= t.suspendedLanes & a, t.warmLanes &= ~a, Ne === t && (he & a) === a && (Xe === 4 || Xe === 3 && (he & 62914560) === he && 300 > ze() - Vs ? (ce & 2) === 0 && la(t, 0) : Jf |= a, hl === he && (hl = 0)), ir(t);
      }
      function gf(t, r) {
        r === 0 && (r = Ed()), t = Ko(t, r), t !== null && (xi(t, r), ir(t));
      }
      function sc(t) {
        var r = t.memoizedState,
          a = 0;
        r !== null && (a = r.retryLane), gf(t, a);
      }
      function Zp(t, r) {
        var a = 0;
        switch (t.tag) {
          case 31:
          case 13:
            var l = t.stateNode,
              c = t.memoizedState;
            c !== null && (a = c.retryLane);
            break;
          case 19:
            l = t.stateNode;
            break;
          case 22:
            l = t.stateNode._retryCache;
            break;
          default:
            throw Error(F(314));
        }
        l !== null && l.delete(r), gf(t, a);
      }
      function Nm(t, r) {
        return Ic(t, r);
      }
      function uc(t, r, a, l) {
        this.tag = t, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = r, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = l, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
      }
      function ks(t) {
        return t = t.prototype, !(!t || !t.isReactComponent);
      }
      function Qr(t, r) {
        var a = t.alternate;
        return a === null ? (a = Yn(t.tag, r, t.key, t.mode), a.elementType = t.elementType, a.type = t.type, a.stateNode = t.stateNode, a.alternate = t, t.alternate = a) : (a.pendingProps = r, a.type = t.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = t.flags & 65011712, a.childLanes = t.childLanes, a.lanes = t.lanes, a.child = t.child, a.memoizedProps = t.memoizedProps, a.memoizedState = t.memoizedState, a.updateQueue = t.updateQueue, r = t.dependencies, a.dependencies = r === null ? null : {
          lanes: r.lanes,
          firstContext: r.firstContext
        }, a.sibling = t.sibling, a.index = t.index, a.ref = t.ref, a.refCleanup = t.refCleanup, a;
      }
      function yf(t, r) {
        t.flags &= 65011714;
        var a = t.alternate;
        return a === null ? (t.childLanes = 0, t.lanes = r, t.child = null, t.subtreeFlags = 0, t.memoizedProps = null, t.memoizedState = null, t.updateQueue = null, t.dependencies = null, t.stateNode = null) : (t.childLanes = a.childLanes, t.lanes = a.lanes, t.child = a.child, t.subtreeFlags = 0, t.deletions = null, t.memoizedProps = a.memoizedProps, t.memoizedState = a.memoizedState, t.updateQueue = a.updateQueue, t.type = a.type, r = a.dependencies, t.dependencies = r === null ? null : {
          lanes: r.lanes,
          firstContext: r.firstContext
        }), t;
      }
      function ws(t, r, a, l, c, d) {
        var h = 0;
        if (l = t, typeof t == "function") ks(t) && (h = 1);else if (typeof t == "string") h = Gt && dn ? Df(t, a, Dn.current) ? 26 : Ec(t) ? 27 : 5 : Gt ? Df(t, a, Dn.current) ? 26 : 5 : dn && Ec(t) ? 27 : 5;else e: switch (t) {
          case gc:
            return t = Yn(31, a, r, c), t.elementType = gc, t.lanes = d, t;
          case $a:
            return Eo(a.children, c, d, r);
          case kf:
            h = 8, c |= 24;
            break;
          case Cs:
            return t = Yn(12, a, r, c | 2), t.elementType = Cs, t.lanes = d, t;
          case Va:
            return t = Yn(13, a, r, c), t.elementType = Va, t.lanes = d, t;
          case Te:
            return t = Yn(19, a, r, c), t.elementType = Te, t.lanes = d, t;
          default:
            if (typeof t == "object" && t !== null) switch (t.$$typeof) {
              case Io:
                h = 10;
                break e;
              case mc:
                h = 9;
                break e;
              case Zi:
                h = 11;
                break e;
              case wf:
                h = 14;
                break e;
              case ua:
                h = 16, l = null;
                break e;
            }
            h = 29, a = Error(F(130, t === null ? "null" : typeof t, "")), l = null;
        }
        return r = Yn(h, a, r, c), r.elementType = t, r.type = l, r.lanes = d, r;
      }
      function Eo(t, r, a, l) {
        return t = Yn(7, t, l, r), t.lanes = a, t;
      }
      function Ps(t, r, a) {
        return t = Yn(6, t, null, r), t.lanes = a, t;
      }
      function cc(t) {
        var r = Yn(18, null, null, 0);
        return r.stateNode = t, r;
      }
      function dc(t, r, a) {
        return r = Yn(4, t.children !== null ? t.children : [], t.key, r), r.lanes = a, r.stateNode = {
          containerInfo: t.containerInfo,
          pendingChildren: null,
          implementation: t.implementation
        }, r;
      }
      function bf(t, r, a, l, c, d, h, y, R) {
        this.tag = 1, this.containerInfo = t, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = Lo, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = mu(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = mu(0), this.hiddenUpdates = mu(null), this.identifierPrefix = l, this.onUncaughtError = c, this.onCaughtError = d, this.onRecoverableError = h, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = R, this.incompleteTransitions = new Map();
      }
      function xs(t, r, a, l, c, d, h, y, R, L, j, A) {
        return t = new bf(t, r, a, h, R, L, j, A, y), r = 1, d === !0 && (r |= 24), d = Yn(3, null, null, r), t.current = d, d.stateNode = t, r = Fd(), r.refCount++, t.pooledCache = r, r.refCount++, d.memoizedState = {
          element: l,
          isDehydrated: a,
          cache: r
        }, Ol(d), t;
      }
      function fc(t) {
        return t ? (t = Ka, t) : Ka;
      }
      function vf(t) {
        var r = t._reactInternals;
        if (r === void 0) throw typeof t.render == "function" ? Error(F(188)) : (t = Object.keys(t).join(","), Error(F(268, t)));
        return t = fu(r), t = t !== null ? pu(t) : null, t === null ? null : Ts(t.stateNode);
      }
      function pc(t, r, a, l, c, d) {
        c = fc(c), l.context === null ? l.context = c : l.pendingContext = c, l = Et(r), l.payload = {
          element: a
        }, d = d === void 0 ? null : d, d !== null && (l.callback = d), a = Nr(t, l, r), a !== null && (nt(a, t, r), Ml(a, t, r));
      }
      function Sf(t, r) {
        if (t = t.memoizedState, t !== null && t.dehydrated !== null) {
          var a = t.retryLane;
          t.retryLane = a !== 0 && a < r ? a : r;
        }
      }
      function vr(t, r) {
        Sf(t, r), (t = t.alternate) && Sf(t, r);
      }
      var ie = {},
        Fm = React__namespace["default"],
        tt = Tb__default["default"],
        Lt = Object.assign,
        hc = Symbol.for("react.element"),
        zs = Symbol.for("react.transitional.element"),
        sa = Symbol.for("react.portal"),
        $a = Symbol.for("react.fragment"),
        kf = Symbol.for("react.strict_mode"),
        Cs = Symbol.for("react.profiler"),
        mc = Symbol.for("react.consumer"),
        Io = Symbol.for("react.context"),
        Zi = Symbol.for("react.forward_ref"),
        Va = Symbol.for("react.suspense"),
        Te = Symbol.for("react.suspense_list"),
        wf = Symbol.for("react.memo"),
        ua = Symbol.for("react.lazy");
      var gc = Symbol.for("react.activity");
      var $r = Symbol.for("react.memo_cache_sentinel");
      var Pf = Symbol.iterator,
        xf = Symbol.for("react.client.reference"),
        ca = Array.isArray,
        M = Fm.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
        Yp = m.rendererVersion,
        zf = m.rendererPackageName,
        Cf = m.extraDevToolsConfig,
        Ts = m.getPublicInstance,
        Hm = m.getRootHostContext,
        Xp = m.getChildHostContext,
        Am = m.prepareForCommit,
        _s = m.resetAfterCommit,
        Vr = m.createInstance;
      m.cloneMutableInstance;
      var yc = m.appendInitialChild,
        Kp = m.finalizeInitialChildren,
        Rs = m.shouldSetTextContent,
        bc = m.createTextInstance;
      m.cloneMutableTextInstance;
      var eh = m.scheduleTimeout,
        Tf = m.cancelTimeout,
        Lo = m.noTimeout,
        qt = m.isPrimaryRenderer;
      m.warnsIfNotActing;
      var $n = m.supportsMutation,
        Sr = m.supportsPersistence,
        Hn = m.supportsHydration,
        nh = m.getInstanceFromNode;
      m.beforeActiveInstanceBlur;
      var jm = m.preparePortalMount;
      m.prepareScopeUpdate, m.getInstanceFromScope;
      var yn = m.setCurrentUpdatePriority,
        qr = m.getCurrentUpdatePriority,
        kr = m.resolveUpdatePriority;
      m.trackSchedulerEvent, m.resolveEventType, m.resolveEventTimeStamp;
      var _f = m.shouldAttemptEagerTransition,
        th = m.detachDeletedInstance;
      m.requestPostPaintCallback;
      var rh = m.maySuspendCommit,
        Dm = m.maySuspendCommitOnUpdate,
        Yi = m.maySuspendCommitInSyncRender,
        An = m.preloadInstance,
        oh = m.startSuspendingCommit,
        Vn = m.suspendInstance;
      m.suspendOnActiveViewTransition;
      var ah = m.waitForCommitToBeReady;
      m.getSuspendedCommitReason;
      var rt = m.NotPendingTransition,
        da = m.HostTransitionContext,
        qa = m.resetFormInstance;
      m.bindToConsole;
      var ih = m.supportsMicrotasks,
        Gr = m.scheduleMicrotask,
        Ga = m.supportsTestSelectors,
        Rf = m.findFiberRoot,
        wr = m.getBoundingRect,
        lh = m.getTextContent,
        Jr = m.isHiddenSubtree,
        sh = m.matchAccessibilityRole,
        Es = m.setFocusIfFocusable,
        Ja = m.setupIntersectionObserver,
        uh = m.appendChild,
        ch = m.appendChildToContainer,
        Is = m.commitTextUpdate,
        dh = m.commitMount,
        vc = m.commitUpdate,
        fh = m.insertBefore,
        ph = m.insertInContainerBefore,
        Ef = m.removeChild,
        If = m.removeChildFromContainer,
        Sc = m.resetTextContent,
        hh = m.hideInstance,
        kc = m.hideTextInstance,
        Wm = m.unhideInstance,
        mh = m.unhideTextInstance;
      m.cancelViewTransitionName, m.cancelRootViewTransitionName, m.restoreRootViewTransitionName, m.cloneRootViewTransitionContainer, m.removeRootViewTransitionClone, m.measureClonedInstance, m.hasInstanceChanged, m.hasInstanceAffectedParent, m.startViewTransition, m.startGestureTransition, m.stopViewTransition, m.getCurrentGestureOffset, m.createViewTransitionInstance;
      var Nt = m.clearContainer;
      m.createFragmentInstance, m.updateFragmentInstanceFiber, m.commitNewChildToFragmentInstance, m.deleteChildFromFragmentInstance;
      var gh = m.cloneInstance,
        We = m.createContainerChildSet,
        Lf = m.appendChildToContainerChildSet,
        yh = m.finalizeContainerChildren,
        bh = m.replaceContainerChildren,
        No = m.cloneHiddenInstance,
        Ls = m.cloneHiddenTextInstance,
        Ns = m.isSuspenseInstancePending,
        Fs = m.isSuspenseInstanceFallback,
        Za = m.getSuspenseInstanceFallbackErrorDetails,
        Xi = m.registerSuspenseInstanceRetry,
        vh = m.canHydrateFormStateMarker,
        Sh = m.isFormStateMarkerMatching,
        Nf = m.getNextHydratableSibling,
        kh = m.getNextHydratableSiblingAfterSingleton,
        wc = m.getFirstHydratableChild,
        Pc = m.getFirstHydratableChildWithinContainer,
        Ff = m.getFirstHydratableChildWithinActivityInstance,
        wh = m.getFirstHydratableChildWithinSuspenseInstance,
        Um = m.getFirstHydratableChildWithinSingleton,
        Bm = m.canHydrateInstance,
        Ph = m.canHydrateTextInstance,
        xh = m.canHydrateActivityInstance,
        Om = m.canHydrateSuspenseInstance,
        Ki = m.hydrateInstance,
        xc = m.hydrateTextInstance,
        zh = m.hydrateActivityInstance,
        Hf = m.hydrateSuspenseInstance,
        Ch = m.getNextHydratableInstanceAfterActivityInstance,
        Th = m.getNextHydratableInstanceAfterSuspenseInstance,
        _h = m.commitHydratedInstance,
        Mm = m.commitHydratedContainer,
        Rh = m.commitHydratedActivityInstance,
        el = m.commitHydratedSuspenseInstance,
        Eh = m.finalizeHydratedChildren,
        Ih = m.flushHydrationEvents;
      m.clearActivityBoundary;
      var Se = m.clearSuspenseBoundary;
      m.clearActivityBoundaryFromContainer;
      var Af = m.clearSuspenseBoundaryFromContainer,
        Qm = m.hideDehydratedBoundary,
        Lh = m.unhideDehydratedBoundary,
        Nh = m.shouldDeleteUnhydratedTailInstances;
      m.diffHydratedPropsForDevWarnings, m.diffHydratedTextForDevWarnings, m.describeHydratableInstanceForDevWarnings;
      var $m = m.validateHydratableInstance,
        jf = m.validateHydratableTextInstance,
        Gt = m.supportsResources,
        Df = m.isHostHoistableType,
        zc = m.getHoistableRoot,
        nl = m.getResource,
        Fh = m.acquireResource,
        Hh = m.releaseResource,
        Ya = m.hydrateHoistable,
        Cc = m.mountHoistable,
        Wf = m.unmountHoistable,
        Ah = m.createHoistableInstance,
        jh = m.prepareToCommitHoistables,
        Vm = m.mayResourceSuspendCommit,
        Tc = m.preloadResource,
        Fo = m.suspendResource,
        dn = m.supportsSingletons,
        _c = m.resolveSingletonInstance,
        Rc = m.acquireSingletonInstance,
        fa = m.releaseSingletonInstance,
        Ec = m.isHostSingletonType,
        Xa = m.isSingletonScope,
        Hs = [],
        tl = -1,
        Ka = {},
        vt = Math.clz32 ? Math.clz32 : Em,
        Dh = Math.log,
        Wh = Math.LN2,
        As = 256,
        js = 262144,
        rl = 4194304,
        Ic = tt.unstable_scheduleCallback,
        le = tt.unstable_cancelCallback,
        qm = tt.unstable_shouldYield,
        St = tt.unstable_requestPaint,
        ze = tt.unstable_now,
        Uh = tt.unstable_ImmediatePriority,
        Ho = tt.unstable_UserBlockingPriority,
        Ao = tt.unstable_NormalPriority,
        ol = tt.unstable_IdlePriority,
        Lc = tt.log,
        Uf = tt.unstable_setDisableYieldValue,
        ei = null,
        on = null,
        jn = typeof Object.is == "function" ? Object.is : Im,
        Nc = typeof reportError == "function" ? reportError : function (t) {
          if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var r = new window.ErrorEvent("error", {
              bubbles: !0,
              cancelable: !0,
              message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t),
              error: t
            });
            if (!window.dispatchEvent(r)) return;
          } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", t);
            return;
          }
          console.error(t);
        },
        Bf = Object.prototype.hasOwnProperty,
        al,
        kt,
        Ds = !1,
        Bh = new WeakMap(),
        ni = [],
        il = 0,
        fn = null,
        x = 0,
        Jt = [],
        Zt = 0,
        jo = null,
        ot = 1,
        Zr = "",
        Dn = Ir(null),
        Ws = Ir(null),
        pa = Ir(null),
        Fc = Ir(null),
        bn = null,
        Ue = null,
        ue = !1,
        Do = null,
        Yt = !1,
        Of = Error(F(519)),
        Yr = Ir(null),
        at = null,
        Be = null,
        Xr = typeof AbortController < "u" ? AbortController : function () {
          var t = [],
            r = this.signal = {
              aborted: !1,
              addEventListener: function (a, l) {
                t.push(l);
              }
            };
          this.abort = function () {
            r.aborted = !0, t.forEach(function (a) {
              return a();
            });
          };
        },
        qn = tt.unstable_scheduleCallback,
        Gm = tt.unstable_NormalPriority,
        qe = {
          $$typeof: Io,
          Consumer: null,
          Provider: null,
          _currentValue: null,
          _currentValue2: null,
          _threadCount: 0
        },
        an = null,
        wt = null,
        Mf = !1,
        ll = !1,
        ti = !1,
        Pr = 0,
        Us = null,
        Qf = 0,
        sl = 0,
        ul = null,
        Hc = M.S;
      M.S = function (t, r) {
        Zf = ze(), typeof r == "object" && r !== null && typeof r.then == "function" && Np(t, r), Hc !== null && Hc(t, r);
      };
      var ha = Ir(null),
        cl = Error(F(460)),
        Ac = Error(F(474)),
        jc = Error(F(542)),
        Dc = {
          then: function () {}
        },
        Xt = null,
        Kt = null,
        Bs = 0,
        ri = Ad(!0),
        Oh = Ad(!1),
        er = [],
        xr = 0,
        $f = 0,
        ma = !1,
        Vf = !1,
        Kr = Ir(null),
        Wc = Ir(0),
        Ft = Ir(null),
        zr = null,
        ln = Ir(0),
        Wo = 0,
        ne = null,
        Ie = null,
        pn = null,
        Uc = !1,
        dl = !1,
        oi = !1,
        Bc = 0,
        fl = 0,
        pl = null,
        Jm = 0,
        Os = {
          readContext: In,
          use: Ee,
          useCallback: Ve,
          useContext: Ve,
          useEffect: Ve,
          useImperativeHandle: Ve,
          useLayoutEffect: Ve,
          useInsertionEffect: Ve,
          useMemo: Ve,
          useReducer: Ve,
          useRef: Ve,
          useState: Ve,
          useDebugValue: Ve,
          useDeferredValue: Ve,
          useTransition: Ve,
          useSyncExternalStore: Ve,
          useId: Ve,
          useHostTransitionStatus: Ve,
          useFormState: Ve,
          useActionState: Ve,
          useOptimistic: Ve,
          useMemoCache: Ve,
          useCacheRefresh: Ve
        };
      Os.useEffectEvent = Ve;
      var Mh = {
          readContext: In,
          use: Ee,
          useCallback: function (t, r) {
            return Ln().memoizedState = [t, r === void 0 ? null : r], t;
          },
          useContext: In,
          useEffect: Bd,
          useImperativeHandle: function (t, r, a) {
            a = a != null ? a.concat([t]) : null, Xl(4194308, 4, jp.bind(null, r, t), a);
          },
          useLayoutEffect: function (t, r) {
            return Xl(4194308, 4, t, r);
          },
          useInsertionEffect: function (t, r) {
            Xl(4, 2, t, r);
          },
          useMemo: function (t, r) {
            var a = Ln();
            r = r === void 0 ? null : r;
            var l = t();
            if (oi) {
              pe(!0);
              try {
                t();
              } finally {
                pe(!1);
              }
            }
            return a.memoizedState = [l, r], l;
          },
          useReducer: function (t, r, a) {
            var l = Ln();
            if (a !== void 0) {
              var c = a(r);
              if (oi) {
                pe(!0);
                try {
                  a(r);
                } finally {
                  pe(!1);
                }
              }
            } else c = r;
            return l.memoizedState = l.baseState = c, t = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: t,
              lastRenderedState: c
            }, l.queue = t, t = t.dispatch = Nn.bind(null, ne, t), [l.memoizedState, t];
          },
          useRef: function (t) {
            var r = Ln();
            return t = {
              current: t
            }, r.memoizedState = t;
          },
          useState: function (t) {
            t = Xn(t);
            var r = t.queue,
              a = Nu.bind(null, ne, r);
            return r.dispatch = a, [t.memoizedState, a];
          },
          useDebugValue: Qd,
          useDeferredValue: function (t, r) {
            var a = Ln();
            return Iu(a, t, r);
          },
          useTransition: function () {
            var t = Xn(!1);
            return t = $d.bind(null, ne, t.queue, !0, !1), Ln().memoizedState = t, [!1, t];
          },
          useSyncExternalStore: function (t, r, a) {
            var l = ne,
              c = Ln();
            if (ue) {
              if (a === void 0) throw Error(F(407));
              a = a();
            } else {
              if (a = r(), Ne === null) throw Error(F(349));
              (he & 127) !== 0 || Hp(l, r, a);
            }
            c.memoizedState = a;
            var d = {
              value: a,
              getSnapshot: r
            };
            return c.queue = d, Bd(ql.bind(null, l, d, t), [t]), l.flags |= 2048, Kn(9, {
              destroy: void 0
            }, jr.bind(null, l, d, a, r), null), a;
          },
          useId: function () {
            var t = Ln(),
              r = Ne.identifierPrefix;
            if (ue) {
              var a = Zr,
                l = ot;
              a = (l & ~(1 << 32 - vt(l) - 1)).toString(32) + a, r = "_" + r + "R_" + a, a = Bc++, 0 < a && (r += "H" + a.toString(32)), r += "_";
            } else a = Jm++, r = "_" + r + "r_" + a.toString(32) + "_";
            return t.memoizedState = r;
          },
          useHostTransitionStatus: Lu,
          useFormState: pr,
          useActionState: pr,
          useOptimistic: function (t) {
            var r = Ln();
            r.memoizedState = r.baseState = t;
            var a = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: null,
              lastRenderedState: null
            };
            return r.queue = a, r = Wi.bind(null, ne, !0, a), a.dispatch = r, [t, r];
          },
          useMemoCache: Hi,
          useCacheRefresh: function () {
            return Ln().memoizedState = Dp.bind(null, ne);
          },
          useEffectEvent: function (t) {
            var r = Ln(),
              a = {
                impl: t
              };
            return r.memoizedState = a, function () {
              if ((ce & 2) !== 0) throw Error(F(440));
              return a.impl.apply(void 0, arguments);
            };
          }
        },
        qf = {
          readContext: In,
          use: Ee,
          useCallback: Eu,
          useContext: In,
          useEffect: Tu,
          useImperativeHandle: Md,
          useInsertionEffect: Od,
          useLayoutEffect: Ru,
          useMemo: Kl,
          useReducer: Ai,
          useRef: Wa,
          useState: function () {
            return Ai(Ar);
          },
          useDebugValue: Qd,
          useDeferredValue: function (t, r) {
            var a = He();
            return es(a, Ie.memoizedState, t, r);
          },
          useTransition: function () {
            var t = Ai(Ar)[0],
              r = He().memoizedState;
            return [typeof t == "boolean" ? t : sr(t), r];
          },
          useSyncExternalStore: ur,
          useId: xo,
          useHostTransitionStatus: Lu,
          useFormState: Ud,
          useActionState: Ud,
          useOptimistic: function (t, r) {
            var a = He();
            return mt(a, Ie, t, r);
          },
          useMemoCache: Hi,
          useCacheRefresh: qd
        };
      qf.useEffectEvent = _u;
      var Qh = {
        readContext: In,
        use: Ee,
        useCallback: Eu,
        useContext: In,
        useEffect: Tu,
        useImperativeHandle: Md,
        useInsertionEffect: Od,
        useLayoutEffect: Ru,
        useMemo: Kl,
        useReducer: Da,
        useRef: Wa,
        useState: function () {
          return Da(Ar);
        },
        useDebugValue: Qd,
        useDeferredValue: function (t, r) {
          var a = He();
          return Ie === null ? Iu(a, t, r) : es(a, Ie.memoizedState, t, r);
        },
        useTransition: function () {
          var t = Da(Ar)[0],
            r = He().memoizedState;
          return [typeof t == "boolean" ? t : sr(t), r];
        },
        useSyncExternalStore: ur,
        useId: xo,
        useHostTransitionStatus: Lu,
        useFormState: Yl,
        useActionState: Yl,
        useOptimistic: function (t, r) {
          var a = He();
          return Ie !== null ? mt(a, Ie, t, r) : (a.baseState = t, [t, a.queue.dispatch]);
        },
        useMemoCache: Hi,
        useCacheRefresh: qd
      };
      Qh.useEffectEvent = _u;
      var Oc = {
          enqueueSetState: function (t, r, a) {
            t = t._reactInternals;
            var l = bt(),
              c = Et(l);
            c.payload = r, a != null && (c.callback = a), r = Nr(t, c, l), r !== null && (nt(r, t, l), Ml(r, t, l));
          },
          enqueueReplaceState: function (t, r, a) {
            t = t._reactInternals;
            var l = bt(),
              c = Et(l);
            c.tag = 1, c.payload = r, a != null && (c.callback = a), r = Nr(t, c, l), r !== null && (nt(r, t, l), Ml(r, t, l));
          },
          enqueueForceUpdate: function (t, r) {
            t = t._reactInternals;
            var a = bt(),
              l = Et(a);
            l.tag = 2, r != null && (l.callback = r), r = Nr(t, l, a), r !== null && (nt(r, t, a), Ml(r, t, a));
          }
        },
        Mc = Error(F(461)),
        hn = !1,
        Qc = {
          dehydrated: null,
          treeContext: null,
          retryLane: 0,
          hydrationErrors: null
        },
        eo = !1,
        sn = !1,
        Ms = !1,
        $c = typeof WeakSet == "function" ? WeakSet : Set,
        Pn = null,
        mn = null,
        Pt = !1,
        Cr = null,
        ga = 8192,
        Zm = {
          getCacheForType: function (t) {
            var r = In(qe),
              a = r.data.get(t);
            return a === void 0 && (a = t(), r.data.set(t, a)), a;
          },
          cacheSignal: function () {
            return In(qe).controller.signal;
          }
        },
        Vc = 0,
        qc = 1,
        Gc = 2,
        Jc = 3,
        Zc = 4;
      if (typeof Symbol == "function" && Symbol.for) {
        var Qs = Symbol.for;
        Vc = Qs("selector.component"), qc = Qs("selector.has_pseudo_class"), Gc = Qs("selector.role"), Jc = Qs("selector.test_id"), Zc = Qs("selector.text");
      }
      var Ym = typeof WeakMap == "function" ? WeakMap : Map,
        ce = 0,
        Ne = null,
        de = null,
        he = 0,
        _e = 0,
        Ht = null,
        ya = !1,
        ai = !1,
        Gf = !1,
        Uo = 0,
        Xe = 0,
        ba = 0,
        ii = 0,
        Jf = 0,
        At = 0,
        hl = 0,
        $s = null,
        xt = null,
        Yc = !1,
        Vs = 0,
        Zf = 0,
        ml = 1 / 0,
        Xc = null,
        va = null,
        Re = 0,
        Bo = null,
        Sa = null,
        no = 0,
        Kc = 0,
        ed = null,
        $h = null,
        gl = 0,
        nd = null;
      return ie.attemptContinuousHydration = function (t) {
        if (t.tag === 13 || t.tag === 31) {
          var r = Ko(t, 67108864);
          r !== null && nt(r, t, 67108864), vr(t, 67108864);
        }
      }, ie.attemptHydrationAtCurrentPriority = function (t) {
        if (t.tag === 13 || t.tag === 31) {
          var r = bt();
          r = st(r);
          var a = Ko(t, r);
          a !== null && nt(a, t, r), vr(t, r);
        }
      }, ie.attemptSynchronousHydration = function (t) {
        switch (t.tag) {
          case 3:
            if (t = t.stateNode, t.current.memoizedState.isDehydrated) {
              var r = Zo(t.pendingLanes);
              if (r !== 0) {
                for (t.pendingLanes |= 2, t.entangledLanes |= 2; r;) {
                  var a = 1 << 31 - vt(r);
                  t.entanglements[1] |= a, r &= ~a;
                }
                ir(t), (ce & 6) === 0 && (ml = ze() + 500, Ea(0, !1));
              }
            }
            break;
          case 31:
          case 13:
            r = Ko(t, 2), r !== null && nt(r, t, 2), ia(), vr(t, 2);
        }
      }, ie.batchedUpdates = function (t, r) {
        return t(r);
      }, ie.createComponentSelector = function (t) {
        return {
          $$typeof: Vc,
          value: t
        };
      }, ie.createContainer = function (t, r, a, l, c, d, h, y, R, L) {
        return xs(t, r, !1, null, a, l, d, null, h, y, R, L);
      }, ie.createHasPseudoClassSelector = function (t) {
        return {
          $$typeof: qc,
          value: t
        };
      }, ie.createHydrationContainer = function (t, r, a, l, c, d, h, y, R, L, j, A, W, V) {
        var _r2;
        return t = xs(a, l, !0, t, c, d, y, V, R, L, j, A), t.context = fc(null), a = t.current, l = bt(), l = st(l), c = Et(l), c.callback = (_r2 = r) != null ? _r2 : null, Nr(a, c, l), r = l, t.current.lanes = r, xi(t, r), ir(t), t;
      }, ie.createPortal = function (t, r, a) {
        var l = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
          $$typeof: sa,
          key: l == null ? null : "" + l,
          children: t,
          containerInfo: r,
          implementation: a
        };
      }, ie.createRoleSelector = function (t) {
        return {
          $$typeof: Gc,
          value: t
        };
      }, ie.createTestNameSelector = function (t) {
        return {
          $$typeof: Jc,
          value: t
        };
      }, ie.createTextSelector = function (t) {
        return {
          $$typeof: Zc,
          value: t
        };
      }, ie.defaultOnCaughtError = function (t) {
        console.error(t);
      }, ie.defaultOnRecoverableError = function (t) {
        Nc(t);
      }, ie.defaultOnUncaughtError = function (t) {
        Nc(t);
      }, ie.deferredUpdates = function (t) {
        var r = M.T,
          a = qr();
        try {
          return yn(32), M.T = null, t();
        } finally {
          yn(a), M.T = r;
        }
      }, ie.discreteUpdates = function (t, r, a, l, c) {
        var d = M.T,
          h = qr();
        try {
          return yn(2), M.T = null, t(r, a, l, c);
        } finally {
          yn(h), M.T = d, ce === 0 && (ml = ze() + 500);
        }
      }, ie.findAllNodes = gs, ie.findBoundingRects = function (t, r) {
        if (!Ga) throw Error(F(363));
        r = gs(t, r), t = [];
        for (var a = 0; a < r.length; a++) t.push(wr(r[a]));
        for (r = t.length - 1; 0 < r; r--) {
          a = t[r];
          for (var l = a.x, c = l + a.width, d = a.y, h = d + a.height, y = r - 1; 0 <= y; y--) if (r !== y) {
            var R = t[y],
              L = R.x,
              j = L + R.width,
              A = R.y,
              W = A + R.height;
            if (l >= L && d >= A && c <= j && h <= W) {
              t.splice(r, 1);
              break;
            } else if (l !== L || a.width !== R.width || W < d || A > h) {
              if (!(d !== A || a.height !== R.height || j < l || L > c)) {
                L > l && (R.width += L - l, R.x = l), j < c && (R.width = c - L), t.splice(r, 1);
                break;
              }
            } else {
              A > d && (R.height += A - d, R.y = d), W < h && (R.height = h - A), t.splice(r, 1);
              break;
            }
          }
        }
        return t;
      }, ie.findHostInstance = vf, ie.findHostInstanceWithNoPortals = function (t) {
        return t = fu(t), t = t !== null ? lt(t) : null, t === null ? null : Ts(t.stateNode);
      }, ie.findHostInstanceWithWarning = function (t) {
        return vf(t);
      }, ie.flushPassiveEffects = rn, ie.flushSyncFromReconciler = function (t) {
        var r = ce;
        ce |= 1;
        var a = M.T,
          l = qr();
        try {
          if (yn(2), M.T = null, t) return t();
        } finally {
          yn(l), M.T = a, ce = r, (ce & 6) === 0 && Ea(0, !1);
        }
      }, ie.flushSyncWork = ia, ie.focusWithin = function (t, r) {
        if (!Ga) throw Error(F(363));
        for (t = Vi(t), r = sf(t, r), r = Array.from(r), t = 0; t < r.length;) {
          var a = r[t++],
            l = a.tag;
          if (!Jr(a)) {
            if ((l === 5 || l === 26 || l === 27) && Es(a.stateNode)) return !0;
            for (a = a.child; a !== null;) r.push(a), a = a.sibling;
          }
        }
        return !1;
      }, ie.getFindAllNodesFailureDescription = function (t, r) {
        if (!Ga) throw Error(F(363));
        var a = 0,
          l = [];
        t = [Vi(t), 0];
        for (var c = 0; c < t.length;) {
          var d = t[c++],
            h = d.tag,
            y = t[c++],
            R = r[y];
          if ((h !== 5 && h !== 26 && h !== 27 || !Jr(d)) && (ms(d, R) && (l.push(nc(R)), y++, y > a && (a = y)), y < r.length)) for (d = d.child; d !== null;) t.push(d, y), d = d.sibling;
        }
        if (a < r.length) {
          for (t = []; a < r.length; a++) t.push(nc(r[a]));
          return `findAllNodes was able to match part of the selector:
  ` + (l.join(" > ") + `

No matching component was found for:
  `) + t.join(" > ");
        }
        return null;
      }, ie.getPublicRootInstance = function (t) {
        if (t = t.current, !t.child) return null;
        switch (t.child.tag) {
          case 27:
          case 5:
            return Ts(t.child.stateNode);
          default:
            return t.child.stateNode;
        }
      }, ie.injectIntoDevTools = function () {
        var t = {
          bundleType: 0,
          version: Yp,
          rendererPackageName: zf,
          currentDispatcherRef: M,
          reconcilerVersion: "19.2.0"
        };
        if (Cf !== null && (t.rendererConfig = Cf), typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") t = !1;else {
          var r = __REACT_DEVTOOLS_GLOBAL_HOOK__;
          if (r.isDisabled || !r.supportsFiber) t = !0;else {
            try {
              ei = r.inject(t), on = r;
            } catch {}
            t = !!r.checkDCE;
          }
        }
        return t;
      }, ie.isAlreadyRendering = function () {
        return (ce & 6) !== 0;
      }, ie.observeVisibleRects = function (t, r, a, l) {
        if (!Ga) throw Error(F(363));
        t = gs(t, r);
        var c = Ja(t, a, l).disconnect;
        return {
          disconnect: function () {
            c();
          }
        };
      }, ie.shouldError = function () {
        return null;
      }, ie.shouldSuspend = function () {
        return !1;
      }, ie.startHostTransition = function (t, r, a, l) {
        if (t.tag !== 5) throw Error(F(476));
        var c = Vd(t).queue;
        $d(t, c, r, rt, a === null ? _d : function () {
          var d = Vd(t);
          return d.next === null && (d = t.alternate.memoizedState), ea(t, d.next.queue, {}, bt()), a(l);
        });
      }, ie.updateContainer = function (t, r, a, l) {
        var c = r.current,
          d = bt();
        return pc(c, d, t, r, a, l), d;
      }, ie.updateContainerSync = function (t, r, a, l) {
        return pc(r.current, 2, t, r, a, l), 2;
      }, ie;
    }, Tt.exports.default = Tt.exports, Object.defineProperty(Tt.exports, "__esModule", {
      value: !0
    });
  }(Og)), Og.exports;
}
var Eb;
function n0() {
  return Eb || (Eb = 1, Rm.exports = Kb() ), Rm.exports;
}
var t0 = n0();
const r0 = Xb(t0);

function createReconciler(config) {
  const reconciler = r0(config);

  // @ts-ignore DefinitelyTyped is not up to date
  reconciler.injectIntoDevTools();
  return reconciler;
}
const NoEventPriority = 0;

// TODO: handle constructor overloads
// https://github.com/pmndrs/react-three-fiber/pull/2931
// https://github.com/microsoft/TypeScript/issues/37079

const catalogue = {};
const PREFIX_REGEX = /^three(?=[A-Z])/;
const toPascalCase = type => `${type[0].toUpperCase()}${type.slice(1)}`;
let i = 0;
const isConstructor = object => typeof object === 'function';
function extend(objects) {
  if (isConstructor(objects)) {
    const Component = `${i++}`;
    catalogue[Component] = objects;
    return Component;
  } else {
    Object.assign(catalogue, objects);
  }
}
function validateInstance(type, props) {
  // Get target from catalogue
  const name = toPascalCase(type);
  const target = catalogue[name];

  // Validate element target
  if (type !== 'primitive' && !target) throw new Error(`R3F: ${name} is not part of the THREE namespace! Did you forget to extend? See: https://docs.pmnd.rs/react-three-fiber/api/objects#using-3rd-party-objects-declaratively`);

  // Validate primitives
  if (type === 'primitive' && !props.object) throw new Error(`R3F: Primitives without 'object' are invalid!`);

  // Throw if an object or literal was passed for args
  if (props.args !== undefined && !Array.isArray(props.args)) throw new Error('R3F: The args prop must be an array!');
}
function createInstance(type, props, root) {
  var _props$object;
  // Remove three* prefix from elements if native element not present
  type = toPascalCase(type) in catalogue ? type : type.replace(PREFIX_REGEX, '');
  validateInstance(type, props);

  // Regenerate the R3F instance for primitives to simulate a new object
  if (type === 'primitive' && (_props$object = props.object) != null && _props$object.__r3f) delete props.object.__r3f;
  return prepare(props.object, root, type, props);
}
function hideInstance(instance) {
  if (!instance.isHidden) {
    var _instance$parent;
    if (instance.props.attach && (_instance$parent = instance.parent) != null && _instance$parent.object) {
      detach(instance.parent, instance);
    } else if (isObject3D(instance.object)) {
      instance.object.visible = false;
    }
    instance.isHidden = true;
    invalidateInstance(instance);
  }
}
function unhideInstance(instance) {
  if (instance.isHidden) {
    var _instance$parent2;
    if (instance.props.attach && (_instance$parent2 = instance.parent) != null && _instance$parent2.object) {
      attach(instance.parent, instance);
    } else if (isObject3D(instance.object) && instance.props.visible !== false) {
      instance.object.visible = true;
    }
    instance.isHidden = false;
    invalidateInstance(instance);
  }
}

// https://github.com/facebook/react/issues/20271
// This will make sure events and attach are only handled once when trees are complete
function handleContainerEffects(parent, child, beforeChild) {
  // Bail if tree isn't mounted or parent is not a container.
  // This ensures that the tree is finalized and React won't discard results to Suspense
  const state = child.root.getState();
  if (!parent.parent && parent.object !== state.scene) return;

  // Create & link object on first run
  if (!child.object) {
    var _child$props$object, _child$props$args;
    // Get target from catalogue
    const target = catalogue[toPascalCase(child.type)];

    // Create object
    child.object = (_child$props$object = child.props.object) != null ? _child$props$object : new target(...((_child$props$args = child.props.args) != null ? _child$props$args : []));
    child.object.__r3f = child;
  }

  // Set initial props
  applyProps(child.object, child.props);

  // Append instance
  if (child.props.attach) {
    attach(parent, child);
  } else if (isObject3D(child.object) && isObject3D(parent.object)) {
    const childIndex = parent.object.children.indexOf(beforeChild == null ? void 0 : beforeChild.object);
    if (beforeChild && childIndex !== -1) {
      // If the child is already in the parent's children array, move it to the new position
      // Otherwise, just insert it at the target position
      const existingIndex = parent.object.children.indexOf(child.object);
      if (existingIndex !== -1) {
        parent.object.children.splice(existingIndex, 1);
        const adjustedIndex = existingIndex < childIndex ? childIndex - 1 : childIndex;
        parent.object.children.splice(adjustedIndex, 0, child.object);
      } else {
        child.object.parent = parent.object;
        parent.object.children.splice(childIndex, 0, child.object);
        child.object.dispatchEvent({
          type: 'added'
        });
        parent.object.dispatchEvent({
          type: 'childadded',
          child: child.object
        });
      }
    } else {
      parent.object.add(child.object);
    }
  }

  // Link subtree
  for (const childInstance of child.children) handleContainerEffects(child, childInstance);

  // Tree was updated, request a frame
  invalidateInstance(child);
}
function appendChild(parent, child) {
  if (!child) return;

  // Link instances
  child.parent = parent;
  parent.children.push(child);

  // Attach tree once complete
  handleContainerEffects(parent, child);
}
function insertBefore(parent, child, beforeChild) {
  if (!child || !beforeChild) return;

  // Link instances
  child.parent = parent;
  const childIndex = parent.children.indexOf(beforeChild);
  if (childIndex !== -1) parent.children.splice(childIndex, 0, child);else parent.children.push(child);

  // Attach tree once complete
  handleContainerEffects(parent, child, beforeChild);
}
function disposeOnIdle(object) {
  if (typeof object.dispose === 'function') {
    const handleDispose = () => {
      try {
        object.dispose();
      } catch {
        // no-op
      }
    };

    // In a testing environment, cleanup immediately
    if (typeof IS_REACT_ACT_ENVIRONMENT !== 'undefined') handleDispose();
    // Otherwise, using a real GPU so schedule cleanup to prevent stalls
    else Tb.unstable_scheduleCallback(Tb.unstable_IdlePriority, handleDispose);
  }
}
function removeChild(parent, child, dispose) {
  if (!child) return;

  // Unlink instances
  child.parent = null;
  const childIndex = parent.children.indexOf(child);
  if (childIndex !== -1) parent.children.splice(childIndex, 1);

  // Eagerly tear down tree
  if (child.props.attach) {
    detach(parent, child);
  } else if (isObject3D(child.object) && isObject3D(parent.object)) {
    parent.object.remove(child.object);
    removeInteractivity(findInitialRoot(child), child.object);
  }

  // Allow objects to bail out of unmount disposal with dispose={null}
  const shouldDispose = child.props.dispose !== null && dispose !== false;

  // Recursively remove instance children
  for (let i = child.children.length - 1; i >= 0; i--) {
    const node = child.children[i];
    removeChild(child, node, shouldDispose);
  }
  child.children.length = 0;

  // Unlink instance object
  delete child.object.__r3f;

  // Dispose object whenever the reconciler feels like it.
  // Never dispose of primitives because their state may be kept outside of React!
  // In order for an object to be able to dispose it
  //   - has a dispose method
  //   - cannot be a <primitive object={...} />
  //   - cannot be a THREE.Scene, because three has broken its own API
  if (shouldDispose && child.type !== 'primitive' && child.object.type !== 'Scene') {
    disposeOnIdle(child.object);
  }

  // Tree was updated, request a frame for top-level instance
  if (dispose === undefined) invalidateInstance(child);
}
function setFiberRef(fiber, publicInstance) {
  for (const _fiber of [fiber, fiber.alternate]) {
    if (_fiber !== null) {
      if (typeof _fiber.ref === 'function') {
        _fiber.refCleanup == null ? void 0 : _fiber.refCleanup();
        const cleanup = _fiber.ref(publicInstance);
        if (typeof cleanup === 'function') _fiber.refCleanup = cleanup;
      } else if (_fiber.ref) {
        _fiber.ref.current = publicInstance;
      }
    }
  }
}
const reconstructed = [];
function swapInstances() {
  // Detach instance
  for (const [instance] of reconstructed) {
    const parent = instance.parent;
    if (parent) {
      if (instance.props.attach) {
        detach(parent, instance);
      } else if (isObject3D(instance.object) && isObject3D(parent.object)) {
        parent.object.remove(instance.object);
      }
      for (const child of instance.children) {
        if (child.props.attach) {
          detach(instance, child);
        } else if (isObject3D(child.object) && isObject3D(instance.object)) {
          instance.object.remove(child.object);
        }
      }
    }

    // If the old instance is hidden, we need to unhide it.
    // React assumes it can discard instances since they're pure for DOM.
    // This isn't true for us since our lifetimes are impure and longliving.
    // So, we manually check if an instance was hidden and unhide it.
    if (instance.isHidden) unhideInstance(instance);

    // Dispose of old object if able
    if (instance.object.__r3f) delete instance.object.__r3f;
    if (instance.type !== 'primitive') disposeOnIdle(instance.object);
  }

  // Update instance
  for (const [instance, props, fiber] of reconstructed) {
    instance.props = props;
    const parent = instance.parent;
    if (parent) {
      var _instance$props$objec, _instance$props$args;
      // Get target from catalogue
      const target = catalogue[toPascalCase(instance.type)];

      // Create object
      instance.object = (_instance$props$objec = instance.props.object) != null ? _instance$props$objec : new target(...((_instance$props$args = instance.props.args) != null ? _instance$props$args : []));
      instance.object.__r3f = instance;
      setFiberRef(fiber, instance.object);

      // Set initial props
      applyProps(instance.object, instance.props);
      if (instance.props.attach) {
        attach(parent, instance);
      } else if (isObject3D(instance.object) && isObject3D(parent.object)) {
        parent.object.add(instance.object);
      }
      for (const child of instance.children) {
        if (child.props.attach) {
          attach(instance, child);
        } else if (isObject3D(child.object) && isObject3D(instance.object)) {
          instance.object.add(child.object);
        }
      }

      // Tree was updated, request a frame
      invalidateInstance(instance);
    }
  }
  reconstructed.length = 0;
}

// Don't handle text instances, make it no-op
const handleTextInstance = () => {};
const NO_CONTEXT = {};
let currentUpdatePriority = NoEventPriority;

// https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberFlags.js
const NoFlags = 0;
const Update = 4;
const reconciler = /* @__PURE__ */createReconciler({
  isPrimaryRenderer: false,
  warnsIfNotActing: false,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  createInstance,
  removeChild,
  appendChild,
  appendInitialChild: appendChild,
  insertBefore,
  appendChildToContainer(container, child) {
    const scene = container.getState().scene.__r3f;
    if (!child || !scene) return;
    appendChild(scene, child);
  },
  removeChildFromContainer(container, child) {
    const scene = container.getState().scene.__r3f;
    if (!child || !scene) return;
    removeChild(scene, child);
  },
  insertInContainerBefore(container, child, beforeChild) {
    const scene = container.getState().scene.__r3f;
    if (!child || !beforeChild || !scene) return;
    insertBefore(scene, child, beforeChild);
  },
  getRootHostContext: () => NO_CONTEXT,
  getChildHostContext: () => NO_CONTEXT,
  commitUpdate(instance, type, oldProps, newProps, fiber) {
    var _newProps$args, _oldProps$args, _newProps$args2;
    validateInstance(type, newProps);
    let reconstruct = false;

    // Reconstruct primitives if object prop changes
    if (instance.type === 'primitive' && oldProps.object !== newProps.object) reconstruct = true;
    // Reconstruct instance if args were added or removed
    else if (((_newProps$args = newProps.args) == null ? void 0 : _newProps$args.length) !== ((_oldProps$args = oldProps.args) == null ? void 0 : _oldProps$args.length)) reconstruct = true;
    // Reconstruct instance if args were changed
    else if ((_newProps$args2 = newProps.args) != null && _newProps$args2.some((value, index) => {
      var _oldProps$args2;
      return value !== ((_oldProps$args2 = oldProps.args) == null ? void 0 : _oldProps$args2[index]);
    })) reconstruct = true;

    // Reconstruct when args or <primitive object={...} have changes
    if (reconstruct) {
      reconstructed.push([instance, {
        ...newProps
      }, fiber]);
    } else {
      // Create a diff-set, flag if there are any changes
      const changedProps = diffProps(instance, newProps);
      if (Object.keys(changedProps).length) {
        Object.assign(instance.props, changedProps);
        applyProps(instance.object, changedProps);
      }
    }

    // Flush reconstructed siblings when we hit the last updated child in a sequence
    const isTailSibling = fiber.sibling === null || (fiber.flags & Update) === NoFlags;
    if (isTailSibling) swapInstances();
  },
  finalizeInitialChildren: () => false,
  commitMount() {},
  getPublicInstance: instance => instance == null ? void 0 : instance.object,
  prepareForCommit: () => null,
  preparePortalMount: container => prepare(container.getState().scene, container, '', {}),
  resetAfterCommit: () => {},
  shouldSetTextContent: () => false,
  clearContainer: () => false,
  hideInstance,
  unhideInstance,
  createTextInstance: handleTextInstance,
  hideTextInstance: handleTextInstance,
  unhideTextInstance: handleTextInstance,
  scheduleTimeout: typeof setTimeout === 'function' ? setTimeout : undefined,
  cancelTimeout: typeof clearTimeout === 'function' ? clearTimeout : undefined,
  noTimeout: -1,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  detachDeletedInstance() {},
  prepareScopeUpdate() {},
  getInstanceFromScope: () => null,
  shouldAttemptEagerTransition: () => false,
  trackSchedulerEvent: () => {},
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1.1,
  requestPostPaintCallback() {},
  maySuspendCommit: () => false,
  preloadInstance: () => true,
  // true indicates already loaded
  suspendInstance() {},
  waitForCommitToBeReady: () => null,
  NotPendingTransition: null,
  // The reconciler types use the internal ReactContext with all the hidden properties
  // so we have to cast from the public React.Context type
  HostTransitionContext: /* @__PURE__ */React__namespace.createContext(null),
  setCurrentUpdatePriority(newPriority) {
    currentUpdatePriority = newPriority;
  },
  getCurrentUpdatePriority() {
    return currentUpdatePriority;
  },
  resolveUpdatePriority() {
    var _window$event;
    if (currentUpdatePriority !== NoEventPriority) return currentUpdatePriority;
    switch (typeof window !== 'undefined' && ((_window$event = window.event) == null ? void 0 : _window$event.type)) {
      case 'click':
      case 'contextmenu':
      case 'dblclick':
      case 'pointercancel':
      case 'pointerdown':
      case 'pointerup':
        return e;
      case 'pointermove':
      case 'pointerout':
      case 'pointerover':
      case 'pointerenter':
      case 'pointerleave':
      case 'wheel':
        return o;
      default:
        return r;
    }
  },
  resetFormInstance() {},
  // @ts-ignore DefinitelyTyped is not up to date
  rendererPackageName: '@react-three/fiber',
  rendererVersion: packageData.version,
  // https://github.com/facebook/react/pull/31975
  // https://github.com/facebook/react/pull/31999
  applyViewTransitionName(_instance, _name, _className) {},
  restoreViewTransitionName(_instance, _props) {},
  cancelViewTransitionName(_instance, _name, _props) {},
  cancelRootViewTransitionName(_rootContainer) {},
  restoreRootViewTransitionName(_rootContainer) {},
  InstanceMeasurement: null,
  measureInstance: _instance => null,
  wasInstanceInViewport: _measurement => true,
  hasInstanceChanged: (_oldMeasurement, _newMeasurement) => false,
  hasInstanceAffectedParent: (_oldMeasurement, _newMeasurement) => false,
  // https://github.com/facebook/react/pull/32002
  // https://github.com/facebook/react/pull/34486
  suspendOnActiveViewTransition(_state, _container) {},
  // https://github.com/facebook/react/pull/32451
  // https://github.com/facebook/react/pull/32760
  startGestureTransition: () => null,
  startViewTransition: () => null,
  stopViewTransition(_transition) {},
  // https://github.com/facebook/react/pull/32038
  createViewTransitionInstance: _name => null,
  // https://github.com/facebook/react/pull/32379
  // https://github.com/facebook/react/pull/32786
  getCurrentGestureOffset(_provider) {
    throw new Error('startGestureTransition is not yet supported in react-three-fiber.');
  },
  // https://github.com/facebook/react/pull/32500
  cloneMutableInstance(instance, _keepChildren) {
    return instance;
  },
  cloneMutableTextInstance(textInstance) {
    return textInstance;
  },
  cloneRootViewTransitionContainer(_rootContainer) {
    throw new Error('Not implemented.');
  },
  removeRootViewTransitionClone(_rootContainer, _clone) {
    throw new Error('Not implemented.');
  },
  // https://github.com/facebook/react/pull/32465
  createFragmentInstance: _fiber => null,
  updateFragmentInstanceFiber(_fiber, _instance) {},
  commitNewChildToFragmentInstance(_child, _fragmentInstance) {},
  deleteChildFromFragmentInstance(_child, _fragmentInstance) {},
  // https://github.com/facebook/react/pull/32653
  measureClonedInstance: _instance => null,
  // https://github.com/facebook/react/pull/32819
  maySuspendCommitOnUpdate: (_type, _oldProps, _newProps) => false,
  maySuspendCommitInSyncRender: (_type, _props) => false,
  // https://github.com/facebook/react/pull/34486
  startSuspendingCommit: () => null,
  // https://github.com/facebook/react/pull/34522
  getSuspendedCommitReason: (_state, _rootContainer) => null
});

const _roots = new Map();
const shallowLoose = {
  objects: 'shallow',
  strict: false
};
function computeInitialSize(canvas, size) {
  if (!size && typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement && canvas.parentElement) {
    const {
      width,
      height,
      top,
      left
    } = canvas.parentElement.getBoundingClientRect();
    return {
      width,
      height,
      top,
      left
    };
  } else if (!size && typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    return {
      width: canvas.width,
      height: canvas.height,
      top: 0,
      left: 0
    };
  }
  return {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    ...size
  };
}
function createRoot(canvas) {
  // Check against mistaken use of createRoot
  const prevRoot = _roots.get(canvas);
  const prevFiber = prevRoot == null ? void 0 : prevRoot.fiber;
  const prevStore = prevRoot == null ? void 0 : prevRoot.store;
  if (prevRoot) console.warn('R3F.createRoot should only be called once!');

  // Report when an error was detected in a previous render
  // https://github.com/pmndrs/react-three-fiber/pull/2261
  const logRecoverableError = typeof reportError === 'function' ?
  // In modern browsers, reportError will dispatch an error event,
  // emulating an uncaught JavaScript error.
  reportError :
  // In older browsers and test environments, fallback to console.error.
  console.error;

  // Create store
  const store = prevStore || createStore(invalidate, advance);
  // Create renderer
  const fiber = prevFiber || reconciler.createContainer(store,
  // container
  t,
  // tag
  null,
  // hydration callbacks
  false,
  // isStrictMode
  null,
  // concurrentUpdatesByDefaultOverride
  '',
  // identifierPrefix
  logRecoverableError,
  // onUncaughtError
  logRecoverableError,
  // onCaughtError
  logRecoverableError,
  // onRecoverableError
  null // transitionCallbacks
  );
  // Map it
  if (!prevRoot) _roots.set(canvas, {
    fiber,
    store
  });

  // Locals
  let onCreated;
  let lastCamera;
  let configured = false;
  let pending = null;
  return {
    async configure(props = {}) {
      let resolve;
      pending = new Promise(_resolve => resolve = _resolve);
      let {
        gl: glConfig,
        size: propsSize,
        scene: sceneOptions,
        events,
        onCreated: onCreatedCallback,
        shadows = false,
        linear = false,
        flat = false,
        legacy = false,
        orthographic = false,
        frameloop = 'always',
        dpr = [1, 2],
        performance,
        raycaster: raycastOptions,
        camera: cameraOptions,
        onPointerMissed
      } = props;
      let state = store.getState();

      // Set up renderer (one time only!)
      let gl = state.gl;
      if (!state.gl) {
        const defaultProps = {
          canvas: canvas,
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true
        };
        const customRenderer = typeof glConfig === 'function' ? await glConfig(defaultProps) : glConfig;
        if (isRenderer(customRenderer)) {
          gl = customRenderer;
        } else {
          gl = new THREE__namespace.WebGLRenderer({
            ...defaultProps,
            ...glConfig
          });
        }
        state.set({
          gl
        });
      }

      // Set up raycaster (one time only!)
      let raycaster = state.raycaster;
      if (!raycaster) state.set({
        raycaster: raycaster = new THREE__namespace.Raycaster()
      });

      // Set raycaster options
      const {
        params,
        ...options
      } = raycastOptions || {};
      if (!is.equ(options, raycaster, shallowLoose)) applyProps(raycaster, {
        ...options
      });
      if (!is.equ(params, raycaster.params, shallowLoose)) applyProps(raycaster, {
        params: {
          ...raycaster.params,
          ...params
        }
      });

      // Create default camera, don't overwrite any user-set state
      if (!state.camera || state.camera === lastCamera && !is.equ(lastCamera, cameraOptions, shallowLoose)) {
        lastCamera = cameraOptions;
        const isCamera = cameraOptions == null ? void 0 : cameraOptions.isCamera;
        const camera = isCamera ? cameraOptions : orthographic ? new THREE__namespace.OrthographicCamera(0, 0, 0, 0, 0.1, 1000) : new THREE__namespace.PerspectiveCamera(75, 0, 0.1, 1000);
        if (!isCamera) {
          camera.position.z = 5;
          if (cameraOptions) {
            applyProps(camera, cameraOptions);
            // Preserve user-defined frustum if possible
            // https://github.com/pmndrs/react-three-fiber/issues/3160
            if (!camera.manual) {
              if ('aspect' in cameraOptions || 'left' in cameraOptions || 'right' in cameraOptions || 'bottom' in cameraOptions || 'top' in cameraOptions) {
                camera.manual = true;
                camera.updateProjectionMatrix();
              }
            }
          }
          // Always look at center by default
          if (!state.camera && !(cameraOptions != null && cameraOptions.rotation)) camera.lookAt(0, 0, 0);
        }
        state.set({
          camera
        });

        // Configure raycaster
        // https://github.com/pmndrs/react-xr/issues/300
        raycaster.camera = camera;
      }

      // Set up scene (one time only!)
      if (!state.scene) {
        let scene;
        if (sceneOptions != null && sceneOptions.isScene) {
          scene = sceneOptions;
          prepare(scene, store, '', {});
        } else {
          scene = new THREE__namespace.Scene();
          prepare(scene, store, '', {});
          if (sceneOptions) applyProps(scene, sceneOptions);
        }
        state.set({
          scene
        });
      }

      // Store events internally
      if (events && !state.events.handlers) state.set({
        events: events(store)
      });
      // Check size, allow it to take on container bounds initially
      const size = computeInitialSize(canvas, propsSize);
      if (!is.equ(size, state.size, shallowLoose)) {
        state.setSize(size.width, size.height, size.top, size.left);
      }
      // Check pixelratio
      if (dpr && state.viewport.dpr !== calculateDpr(dpr)) state.setDpr(dpr);
      // Check frameloop
      if (state.frameloop !== frameloop) state.setFrameloop(frameloop);
      // Check pointer missed
      if (!state.onPointerMissed) state.set({
        onPointerMissed
      });
      // Check performance
      if (performance && !is.equ(performance, state.performance, shallowLoose)) state.set(state => ({
        performance: {
          ...state.performance,
          ...performance
        }
      }));

      // Set up XR (one time only!)
      if (!state.xr) {
        var _gl$xr;
        // Handle frame behavior in WebXR
        const handleXRFrame = (timestamp, frame) => {
          const state = store.getState();
          if (state.frameloop === 'never') return;
          advance(timestamp, true, state, frame);
        };

        // Toggle render switching on session
        const handleSessionChange = () => {
          const state = store.getState();
          state.gl.xr.enabled = state.gl.xr.isPresenting;
          state.gl.xr.setAnimationLoop(state.gl.xr.isPresenting ? handleXRFrame : null);
          if (!state.gl.xr.isPresenting) invalidate(state);
        };

        // WebXR session manager
        const xr = {
          connect() {
            const gl = store.getState().gl;
            gl.xr.addEventListener('sessionstart', handleSessionChange);
            gl.xr.addEventListener('sessionend', handleSessionChange);
          },
          disconnect() {
            const gl = store.getState().gl;
            gl.xr.removeEventListener('sessionstart', handleSessionChange);
            gl.xr.removeEventListener('sessionend', handleSessionChange);
          }
        };

        // Subscribe to WebXR session events
        if (typeof ((_gl$xr = gl.xr) == null ? void 0 : _gl$xr.addEventListener) === 'function') xr.connect();
        state.set({
          xr
        });
      }

      // Set shadowmap
      if (gl.shadowMap) {
        const oldEnabled = gl.shadowMap.enabled;
        const oldType = gl.shadowMap.type;
        gl.shadowMap.enabled = !!shadows;
        if (is.boo(shadows)) {
          gl.shadowMap.type = THREE__namespace.PCFSoftShadowMap;
        } else if (is.str(shadows)) {
          var _types$shadows;
          const types = {
            basic: THREE__namespace.BasicShadowMap,
            percentage: THREE__namespace.PCFShadowMap,
            soft: THREE__namespace.PCFSoftShadowMap,
            variance: THREE__namespace.VSMShadowMap
          };
          gl.shadowMap.type = (_types$shadows = types[shadows]) != null ? _types$shadows : THREE__namespace.PCFSoftShadowMap;
        } else if (is.obj(shadows)) {
          Object.assign(gl.shadowMap, shadows);
        }
        if (oldEnabled !== gl.shadowMap.enabled || oldType !== gl.shadowMap.type) gl.shadowMap.needsUpdate = true;
      }
      THREE__namespace.ColorManagement.enabled = !legacy;

      // Set color space and tonemapping preferences
      if (!configured) {
        gl.outputColorSpace = linear ? THREE__namespace.LinearSRGBColorSpace : THREE__namespace.SRGBColorSpace;
        gl.toneMapping = flat ? THREE__namespace.NoToneMapping : THREE__namespace.ACESFilmicToneMapping;
      }

      // Update color management state
      if (state.legacy !== legacy) state.set(() => ({
        legacy
      }));
      if (state.linear !== linear) state.set(() => ({
        linear
      }));
      if (state.flat !== flat) state.set(() => ({
        flat
      }));

      // Set gl props
      if (glConfig && !is.fun(glConfig) && !isRenderer(glConfig) && !is.equ(glConfig, gl, shallowLoose)) applyProps(gl, glConfig);

      // Set locals
      onCreated = onCreatedCallback;
      configured = true;
      resolve();
      return this;
    },
    render(children) {
      // The root has to be configured before it can be rendered
      if (!configured && !pending) this.configure();
      pending.then(() => {
        reconciler.updateContainer( /*#__PURE__*/jsxRuntime.jsx(Provider, {
          store: store,
          children: children,
          onCreated: onCreated,
          rootElement: canvas
        }), fiber, null, () => undefined);
      });
      return store;
    },
    unmount() {
      unmountComponentAtNode(canvas);
    }
  };
}
function Provider({
  store,
  children,
  onCreated,
  rootElement
}) {
  useIsomorphicLayoutEffect(() => {
    const state = store.getState();
    // Flag the canvas active, rendering will now begin
    state.set(state => ({
      internal: {
        ...state.internal,
        active: true
      }
    }));
    // Notify that init is completed, the scene graph exists, but nothing has yet rendered
    if (onCreated) onCreated(state);
    // Connect events to the targets parent, this is done to ensure events are registered on
    // a shared target, and not on the canvas itself
    if (!store.getState().events.connected) state.events.connect == null ? void 0 : state.events.connect(rootElement);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return /*#__PURE__*/jsxRuntime.jsx(context.Provider, {
    value: store,
    children: children
  });
}
function unmountComponentAtNode(canvas, callback) {
  const root = _roots.get(canvas);
  const fiber = root == null ? void 0 : root.fiber;
  if (fiber) {
    const state = root == null ? void 0 : root.store.getState();
    if (state) state.internal.active = false;
    reconciler.updateContainer(null, fiber, null, () => {
      if (state) {
        setTimeout(() => {
          try {
            var _state$gl, _state$gl$renderLists, _state$gl2, _state$gl3;
            state.events.disconnect == null ? void 0 : state.events.disconnect();
            (_state$gl = state.gl) == null ? void 0 : (_state$gl$renderLists = _state$gl.renderLists) == null ? void 0 : _state$gl$renderLists.dispose == null ? void 0 : _state$gl$renderLists.dispose();
            (_state$gl2 = state.gl) == null ? void 0 : _state$gl2.forceContextLoss == null ? void 0 : _state$gl2.forceContextLoss();
            if ((_state$gl3 = state.gl) != null && _state$gl3.xr) state.xr.disconnect();
            dispose(state.scene);
            _roots.delete(canvas);
            if (callback) callback(canvas);
          } catch (e) {
            /* ... */
          }
        }, 500);
      }
    });
  }
}
function createPortal(children, container, state) {
  return /*#__PURE__*/jsxRuntime.jsx(Portal, {
    children: children,
    container: container,
    state: state
  });
}
function Portal({
  state = {},
  children,
  container
}) {
  /** This has to be a component because it would not be able to call useThree/useStore otherwise since
   *  if this is our environment, then we are not in r3f's renderer but in react-dom, it would trigger
   *  the "R3F hooks can only be used within the Canvas component!" warning:
   *  <Canvas>
   *    {createPortal(...)} */
  const {
    events,
    size,
    ...rest
  } = state;
  const previousRoot = useStore();
  const [raycaster] = React__namespace.useState(() => new THREE__namespace.Raycaster());
  const [pointer] = React__namespace.useState(() => new THREE__namespace.Vector2());
  const inject = useMutableCallback((rootState, injectState) => {
    let viewport = undefined;
    if (injectState.camera && size) {
      const camera = injectState.camera;
      // Calculate the override viewport, if present
      viewport = rootState.viewport.getCurrentViewport(camera, new THREE__namespace.Vector3(), size);
      // Update the portal camera, if it differs from the previous layer
      if (camera !== rootState.camera) updateCamera(camera, size);
    }
    return {
      // The intersect consists of the previous root state
      ...rootState,
      ...injectState,
      // Portals have their own scene, which forms the root, a raycaster and a pointer
      scene: container,
      raycaster,
      pointer,
      mouse: pointer,
      // Their previous root is the layer before it
      previousRoot,
      // Events, size and viewport can be overridden by the inject layer
      events: {
        ...rootState.events,
        ...injectState.events,
        ...events
      },
      size: {
        ...rootState.size,
        ...size
      },
      viewport: {
        ...rootState.viewport,
        ...viewport
      },
      // Layers are allowed to override events
      setEvents: events => injectState.set(state => ({
        ...state,
        events: {
          ...state.events,
          ...events
        }
      }))
    };
  });
  const usePortalStore = React__namespace.useMemo(() => {
    // Create a mirrored store, based on the previous root with a few overrides ...
    const store = traditional.createWithEqualityFn((set, get) => ({
      ...rest,
      set,
      get
    }));

    // Subscribe to previous root-state and copy changes over to the mirrored portal-state
    const onMutate = prev => store.setState(state => inject.current(prev, state));
    onMutate(previousRoot.getState());
    previousRoot.subscribe(onMutate);
    return store;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousRoot, container]);
  return (
    /*#__PURE__*/
    // @ts-ignore, reconciler types are not maintained
    jsxRuntime.jsx(jsxRuntime.Fragment, {
      children: reconciler.createPortal( /*#__PURE__*/jsxRuntime.jsx(context.Provider, {
        value: usePortalStore,
        children: children
      }), usePortalStore, null)
    })
  );
}

/**
 * Force React to flush any updates inside the provided callback synchronously and immediately.
 * All the same caveats documented for react-dom's `flushSync` apply here (see https://react.dev/reference/react-dom/flushSync).
 * Nevertheless, sometimes one needs to render synchronously, for example to keep DOM and 3D changes in lock-step without
 * having to revert to a non-React solution. Note: this will only flush updates within the `Canvas` root.
 */
function flushSync(fn) {
  // @ts-ignore - reconciler types are not maintained
  return reconciler.flushSyncFromReconciler(fn);
}

function createSubs(callback, subs) {
  const sub = {
    callback
  };
  subs.add(sub);
  return () => void subs.delete(sub);
}
const globalEffects = new Set();
const globalAfterEffects = new Set();
const globalTailEffects = new Set();

/**
 * Adds a global render callback which is called each frame.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#addEffect
 */
const addEffect = callback => createSubs(callback, globalEffects);

/**
 * Adds a global after-render callback which is called each frame.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#addAfterEffect
 */
const addAfterEffect = callback => createSubs(callback, globalAfterEffects);

/**
 * Adds a global callback which is called when rendering stops.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#addTail
 */
const addTail = callback => createSubs(callback, globalTailEffects);
function run(effects, timestamp) {
  if (!effects.size) return;
  for (const {
    callback
  } of effects.values()) {
    callback(timestamp);
  }
}
function flushGlobalEffects(type, timestamp) {
  switch (type) {
    case 'before':
      return run(globalEffects, timestamp);
    case 'after':
      return run(globalAfterEffects, timestamp);
    case 'tail':
      return run(globalTailEffects, timestamp);
  }
}
let subscribers;
let subscription;
function update(timestamp, state, frame) {
  // Run local effects
  let delta = state.clock.getDelta();

  // In frameloop='never' mode, clock times are updated using the provided timestamp
  if (state.frameloop === 'never' && typeof timestamp === 'number') {
    delta = timestamp - state.clock.elapsedTime;
    state.clock.oldTime = state.clock.elapsedTime;
    state.clock.elapsedTime = timestamp;
  }

  // Call subscribers (useFrame)
  subscribers = state.internal.subscribers;
  for (let i = 0; i < subscribers.length; i++) {
    subscription = subscribers[i];
    subscription.ref.current(subscription.store.getState(), delta, frame);
  }

  // Render content
  if (!state.internal.priority && state.gl.render) state.gl.render(state.scene, state.camera);

  // Decrease frame count
  state.internal.frames = Math.max(0, state.internal.frames - 1);
  return state.frameloop === 'always' ? 1 : state.internal.frames;
}
let running = false;
let useFrameInProgress = false;
let repeat;
let frame;
let state;
function loop(timestamp) {
  frame = requestAnimationFrame(loop);
  running = true;
  repeat = 0;

  // Run effects
  flushGlobalEffects('before', timestamp);

  // Render all roots
  useFrameInProgress = true;
  for (const root of _roots.values()) {
    var _state$gl$xr;
    state = root.store.getState();

    // If the frameloop is invalidated, do not run another frame
    if (state.internal.active && (state.frameloop === 'always' || state.internal.frames > 0) && !((_state$gl$xr = state.gl.xr) != null && _state$gl$xr.isPresenting)) {
      repeat += update(timestamp, state);
    }
  }
  useFrameInProgress = false;

  // Run after-effects
  flushGlobalEffects('after', timestamp);

  // Stop the loop if nothing invalidates it
  if (repeat === 0) {
    // Tail call effects, they are called when rendering stops
    flushGlobalEffects('tail', timestamp);

    // Flag end of operation
    running = false;
    return cancelAnimationFrame(frame);
  }
}

/**
 * Invalidates the view, requesting a frame to be rendered. Will globally invalidate unless passed a root's state.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#invalidate
 */
function invalidate(state, frames = 1) {
  var _state$gl$xr2;
  if (!state) return _roots.forEach(root => invalidate(root.store.getState(), frames));
  if ((_state$gl$xr2 = state.gl.xr) != null && _state$gl$xr2.isPresenting || !state.internal.active || state.frameloop === 'never') return;
  if (frames > 1) {
    // legacy support for people using frames parameters
    // Increase frames, do not go higher than 60
    state.internal.frames = Math.min(60, state.internal.frames + frames);
  } else {
    if (useFrameInProgress) {
      //called from within a useFrame, it means the user wants an additional frame
      state.internal.frames = 2;
    } else {
      //the user need a new frame, no need to increment further than 1
      state.internal.frames = 1;
    }
  }

  // If the render-loop isn't active, start it
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
}

/**
 * Advances the frameloop and runs render effects, useful for when manually rendering via `frameloop="never"`.
 * @see https://docs.pmnd.rs/react-three-fiber/api/additional-exports#advance
 */
function advance(timestamp, runGlobalEffects = true, state, frame) {
  if (runGlobalEffects) flushGlobalEffects('before', timestamp);
  if (!state) for (const root of _roots.values()) update(timestamp, root.store.getState());else update(timestamp, state, frame);
  if (runGlobalEffects) flushGlobalEffects('after', timestamp);
}

const DOM_EVENTS = {
  onClick: ['click', false],
  onContextMenu: ['contextmenu', false],
  onDoubleClick: ['dblclick', false],
  onWheel: ['wheel', true],
  onPointerDown: ['pointerdown', true],
  onPointerUp: ['pointerup', true],
  onPointerLeave: ['pointerleave', true],
  onPointerMove: ['pointermove', true],
  onPointerCancel: ['pointercancel', true],
  onLostPointerCapture: ['lostpointercapture', true]
};

/** Default R3F event manager for web */
function createPointerEvents(store) {
  const {
    handlePointer
  } = createEvents(store);
  return {
    priority: 1,
    enabled: true,
    compute(event, state, previous) {
      // https://github.com/pmndrs/react-three-fiber/pull/782
      // Events trigger outside of canvas when moved, use offsetX/Y by default and allow overrides
      state.pointer.set(event.offsetX / state.size.width * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1);
      state.raycaster.setFromCamera(state.pointer, state.camera);
    },
    connected: undefined,
    handlers: Object.keys(DOM_EVENTS).reduce((acc, key) => ({
      ...acc,
      [key]: handlePointer(key)
    }), {}),
    update: () => {
      var _internal$lastEvent;
      const {
        events,
        internal
      } = store.getState();
      if ((_internal$lastEvent = internal.lastEvent) != null && _internal$lastEvent.current && events.handlers) events.handlers.onPointerMove(internal.lastEvent.current);
    },
    connect: target => {
      const {
        set,
        events
      } = store.getState();
      events.disconnect == null ? void 0 : events.disconnect();
      set(state => ({
        events: {
          ...state.events,
          connected: target
        }
      }));
      if (events.handlers) {
        for (const name in events.handlers) {
          const event = events.handlers[name];
          const [eventName, passive] = DOM_EVENTS[name];
          target.addEventListener(eventName, event, {
            passive
          });
        }
      }
    },
    disconnect: () => {
      const {
        set,
        events
      } = store.getState();
      if (events.connected) {
        if (events.handlers) {
          for (const name in events.handlers) {
            const event = events.handlers[name];
            const [eventName] = DOM_EVENTS[name];
            events.connected.removeEventListener(eventName, event);
          }
        }
        set(state => ({
          events: {
            ...state.events,
            connected: undefined
          }
        }));
      }
    }
  };
}

exports.Block = Block;
exports.ErrorBoundary = ErrorBoundary;
exports._roots = _roots;
exports.act = act;
exports.addAfterEffect = addAfterEffect;
exports.addEffect = addEffect;
exports.addTail = addTail;
exports.advance = advance;
exports.applyProps = applyProps;
exports.buildGraph = buildGraph;
exports.context = context;
exports.createEvents = createEvents;
exports.createPointerEvents = createPointerEvents;
exports.createPortal = createPortal;
exports.createRoot = createRoot;
exports.dispose = dispose;
exports.extend = extend;
exports.flushGlobalEffects = flushGlobalEffects;
exports.flushSync = flushSync;
exports.getRootState = getRootState;
exports.invalidate = invalidate;
exports.isRef = isRef;
exports.reconciler = reconciler;
exports.threeTypes = threeTypes;
exports.unmountComponentAtNode = unmountComponentAtNode;
exports.useBridge = useBridge;
exports.useFrame = useFrame;
exports.useGraph = useGraph;
exports.useInstanceHandle = useInstanceHandle;
exports.useIsomorphicLayoutEffect = useIsomorphicLayoutEffect;
exports.useLoader = useLoader;
exports.useMutableCallback = useMutableCallback;
exports.useStore = useStore;
exports.useThree = useThree;
