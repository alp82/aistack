import * as React from "react";
import { createElement } from "react";
import { Asset } from "./Asset.js";
import { useRouter } from "./useRouter.js";
import { useRouterState } from "./useRouterState.js";
const useTags = () => {
  const router = useRouter();
  const nonce = router.options.ssr?.nonce;
  const routeMeta = useRouterState({
    select: (state) => {
      return state.matches.map((match) => match.meta).filter(Boolean);
    }
  });
  const meta = React.useMemo(() => {
    const resultMeta = [];
    const metaByAttribute = {};
    let title;
    for (let i = routeMeta.length - 1; i >= 0; i--) {
      const metas = routeMeta[i];
      for (let j = metas.length - 1; j >= 0; j--) {
        const m = metas[j];
        if (!m) continue;
        if (m.title) {
          if (!title) {
            title = {
              tag: "title",
              children: m.title
            };
          }
        } else {
          const attribute = m.name ?? m.property;
          if (attribute) {
            if (metaByAttribute[attribute]) {
              continue;
            } else {
              metaByAttribute[attribute] = true;
            }
          }
          resultMeta.push({
            tag: "meta",
            attrs: {
              ...m,
              nonce
            }
          });
        }
      }
    }
    if (title) {
      resultMeta.push(title);
    }
    if (nonce) {
      resultMeta.push({
        tag: "meta",
        attrs: {
          property: "csp-nonce",
          content: nonce
        }
      });
    }
    resultMeta.reverse();
    return resultMeta;
  }, [routeMeta, nonce]);
  const links = useRouterState({
    select: (state) => {
      const constructed = state.matches.map((match) => match.links).filter(Boolean).flat(1).map((link) => ({
        tag: "link",
        attrs: {
          ...link,
          nonce
        }
      }));
      const manifest = router.ssr?.manifest;
      const assets = state.matches.map((match) => manifest?.routes[match.routeId]?.assets ?? []).filter(Boolean).flat(1).filter((asset) => asset.tag === "link").map(
        (asset) => ({
          tag: "link",
          attrs: {
            ...asset.attrs,
            suppressHydrationWarning: true,
            nonce
          }
        })
      );
      return [...constructed, ...assets];
    },
    structuralSharing: true
  });
  const preloadLinks = useRouterState({
    select: (state) => {
      const preloadLinks2 = [];
      state.matches.map((match) => router.looseRoutesById[match.routeId]).forEach(
        (route) => router.ssr?.manifest?.routes[route.id]?.preloads?.filter(Boolean).forEach((preload) => {
          preloadLinks2.push({
            tag: "link",
            attrs: {
              rel: "modulepreload",
              href: preload,
              nonce
            }
          });
        })
      );
      return preloadLinks2;
    },
    structuralSharing: true
  });
  const styles = useRouterState({
    select: (state) => state.matches.map((match) => match.styles).flat(1).filter(Boolean).map(({ children, ...attrs }) => ({
      tag: "style",
      attrs,
      children,
      nonce
    })),
    structuralSharing: true
  });
  const headScripts = useRouterState({
    select: (state) => state.matches.map((match) => match.headScripts).flat(1).filter(Boolean).map(({ children, ...script }) => ({
      tag: "script",
      attrs: {
        ...script,
        nonce
      },
      children
    })),
    structuralSharing: true
  });
  return uniqBy(
    [
      ...meta,
      ...preloadLinks,
      ...links,
      ...styles,
      ...headScripts
    ],
    (d) => {
      return JSON.stringify(d);
    }
  );
};
function HeadContent() {
  const tags = useTags();
  const router = useRouter();
  const nonce = router.options.ssr?.nonce;
  return tags.map((tag) => /* @__PURE__ */ createElement(Asset, { ...tag, key: `tsr-meta-${JSON.stringify(tag)}`, nonce }));
}
function uniqBy(arr, fn) {
  const seen = /* @__PURE__ */ new Set();
  return arr.filter((item) => {
    const key = fn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
export {
  HeadContent,
  useTags
};
//# sourceMappingURL=HeadContent.js.map
