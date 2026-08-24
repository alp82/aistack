import {
  placeTooltip,
  pointInBounds,
  sceneToClient,
  viewportBounds
} from "./tooltip-position.js";
const portal = {
  id: "portal",
  create: createPortal
};
function createPortal(context, initialOptions) {
  let options = initialOptions;
  let listening = false;
  let usesPopover = false;
  let popoverOpen = false;
  let popoverFailed = false;
  let positionFrame;
  let positionContext;
  const { container, element } = context;
  const document = container.ownerDocument;
  const view = document.defaultView;
  const resizeObserver = view?.ResizeObserver ? new view.ResizeObserver(schedulePosition) : void 0;
  resizeObserver?.observe(element);
  function schedulePosition() {
    if (!positionContext || positionFrame !== void 0) return;
    if (!view?.requestAnimationFrame) {
      position(positionContext);
      return;
    }
    positionFrame = view.requestAnimationFrame(() => {
      positionFrame = void 0;
      if (positionContext) position(positionContext);
    });
  }
  function startListening() {
    if (listening) return;
    listening = true;
    view?.addEventListener("scroll", schedulePosition, {
      capture: true,
      passive: true
    });
    view?.addEventListener("resize", schedulePosition, { passive: true });
    view?.visualViewport?.addEventListener("scroll", schedulePosition, {
      passive: true
    });
    view?.visualViewport?.addEventListener("resize", schedulePosition, {
      passive: true
    });
    resizeObserver?.observe(container);
  }
  function stopListening() {
    if (!listening) return;
    listening = false;
    view?.removeEventListener("scroll", schedulePosition, true);
    view?.removeEventListener("resize", schedulePosition);
    view?.visualViewport?.removeEventListener("scroll", schedulePosition);
    view?.visualViewport?.removeEventListener("resize", schedulePosition);
    resizeObserver?.unobserve(container);
    if (positionFrame !== void 0) {
      view?.cancelAnimationFrame?.(positionFrame);
      positionFrame = void 0;
    }
  }
  function configureParent() {
    const showPopover2 = element.showPopover;
    if (typeof showPopover2 === "function" && !popoverFailed) {
      if (element.parentNode !== container) container.append(element);
      element.setAttribute("popover", "manual");
      element.dataset.tsChartTooltipPortal = "popover";
      element.style.zIndex = "1";
      usesPopover = true;
    } else {
      moveToFallback();
    }
    Object.assign(element.style, {
      position: "fixed",
      right: "auto",
      bottom: "auto",
      margin: "0"
    });
  }
  function position(next) {
    positionContext = next;
    startListening();
    configureParent();
    const anchor = sceneToClient(
      next.surface.element,
      next.scene.width,
      next.scene.height,
      next.anchor
    );
    const boundary = viewportBounds(document);
    if (!anchor || boundary.right <= boundary.left || boundary.bottom <= boundary.top || !pointInBounds(anchor, boundary)) {
      hide(false);
      return false;
    }
    element.removeAttribute("hidden");
    if (usesPopover && !showPopover()) {
      popoverFailed = true;
      moveToFallback();
    }
    placeTooltip(
      element,
      anchor.x,
      anchor.y,
      boundary,
      next.placement,
      next.offset
    );
    return true;
  }
  function moveToFallback() {
    hidePopover();
    usesPopover = false;
    element.removeAttribute("popover");
    element.dataset.tsChartTooltipPortal = "fallback";
    element.style.zIndex = "2147483647";
    const parent = document.body ?? document.documentElement;
    if (element.parentNode !== parent) parent.append(element);
  }
  function showPopover() {
    if (!usesPopover) return false;
    if (popoverIsOpen()) return true;
    try {
      ;
      element.showPopover();
      popoverOpen = true;
      return true;
    } catch {
      popoverOpen = false;
      return false;
    }
  }
  function hidePopover() {
    if (!usesPopover) return;
    try {
      if (popoverIsOpen()) {
        ;
        element.hidePopover?.();
      }
    } catch {
    }
    popoverOpen = false;
  }
  function popoverIsOpen() {
    if (!usesPopover) return false;
    try {
      return element.matches(":popover-open");
    } catch {
      return popoverOpen;
    }
  }
  function hide(stop = true) {
    hidePopover();
    element.setAttribute("hidden", "");
    if (stop) {
      positionContext = void 0;
      stopListening();
    }
  }
  configureParent();
  return {
    update(nextOptions) {
      options = nextOptions;
      void options;
    },
    position,
    hide,
    destroy() {
      positionContext = void 0;
      stopListening();
      hidePopover();
      resizeObserver?.disconnect();
      usesPopover = false;
      popoverOpen = false;
      popoverFailed = false;
      element.removeAttribute("popover");
      delete element.dataset.tsChartTooltipPortal;
    }
  };
}
export {
  portal
};
