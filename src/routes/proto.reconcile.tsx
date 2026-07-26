/**
 * THROWAWAY BRIDGE ROUTE — mounts .prototypes/reconcile-surface.tsx
 * Wayfinder ticket #39. TanStack scans src/routes/ only, so the prototype
 * needs a thin route to be reachable in the browser.
 *
 *   http://localhost:3019/proto/reconcile?variant=A&state=live
 *
 * Delete before merging to main; this belongs on the prototype branch.
 */
import { createFileRoute } from "@tanstack/react-router";
import { ReconcilePrototype } from "../../.prototypes/reconcile-surface";

export const Route = createFileRoute("/proto/reconcile")({
	component: ReconcilePrototype,
});
